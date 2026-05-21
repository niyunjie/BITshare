(() => {
  const DB_NAME = "__bit_kcdg_scrape_db__";
  const DB_VERSION = 1;
  const META_STORE = "meta";
  const PAGE_STORE = "pages";
  const META_KEY = "checkpoint";
  const RETRY_LIMIT = 8;
  const BASE_DELAY_MS = 1200;
  const BETWEEN_PAGES_MS = 150;
  const CHECKPOINT_EVERY = 25;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const text = (node) => (node ? node.textContent.trim() : "");

  const requestToPromise = (request) =>
    new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

  const transactionDone = (tx) =>
    new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted"));
      tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed"));
    });

  const openDb = () =>
    new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE);
        }
        if (!db.objectStoreNames.contains(PAGE_STORE)) {
          const store = db.createObjectStore(PAGE_STORE, { keyPath: "key" });
          store.createIndex("runKey", "runKey", { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

  const loadCheckpoint = async (db, runKey) => {
    const tx = db.transaction([META_STORE], "readonly");
    const meta = await requestToPromise(tx.objectStore(META_STORE).get(META_KEY));
    await transactionDone(tx);
    if (!meta || meta.runKey !== runKey) return null;
    return meta;
  };

  const loadRows = async (db, runKey) => {
    const tx = db.transaction([PAGE_STORE], "readonly");
    const store = tx.objectStore(PAGE_STORE);
    const rows = [];

    await new Promise((resolve, reject) => {
      const request = store.openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve();
          return;
        }
        const value = cursor.value;
        if (value.runKey === runKey) {
          rows.push(value);
        }
        cursor.continue();
      };
      request.onerror = () => reject(request.error);
    });

    await transactionDone(tx);
    rows.sort((a, b) => a.page - b.page);
    return rows.flatMap((item) => item.rows);
  };

  const saveCheckpoint = async (db, checkpoint, pageRows) => {
    const tx = db.transaction([META_STORE, PAGE_STORE], "readwrite");
    tx.objectStore(META_STORE).put(checkpoint, META_KEY);
    tx.objectStore(PAGE_STORE).put({
      key: `${checkpoint.runKey}:${checkpoint.last_page}`,
      runKey: checkpoint.runKey,
      page: checkpoint.last_page,
      rows: pageRows,
    });
    await transactionDone(tx);
  };

  const clearCheckpoint = async (db, runKey) => {
    const pages = await loadPageKeys(db, runKey);
    const tx = db.transaction([META_STORE, PAGE_STORE], "readwrite");
    tx.objectStore(META_STORE).delete(META_KEY);
    const store = tx.objectStore(PAGE_STORE);
    for (const key of pages) {
      store.delete(key);
    }
    await transactionDone(tx);
  };

  const loadPageKeys = async (db, runKey) => {
    const tx = db.transaction([PAGE_STORE], "readonly");
    const store = tx.objectStore(PAGE_STORE);
    const keys = [];

    await new Promise((resolve, reject) => {
      const request = store.openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve();
          return;
        }
        if (cursor.value.runKey === runKey) {
          keys.push(cursor.value.key);
        }
        cursor.continue();
      };
      request.onerror = () => reject(request.error);
    });

    await transactionDone(tx);
    return keys;
  };

  const parseOutlineUrl = (anchor) => {
    if (!anchor) return "";
    const raw = anchor.getAttribute("href") || "";
    const match = raw.match(/vJsMod\('([^']+)'/);
    if (!match) return raw;
    const path = match[1].replace(/&amp;/g, "&");
    return new URL(path, location.origin).href;
  };

  const parseStats = (doc) => {
    const statsText = text(doc.querySelector(".Nsb_r_list_fy3"));
    const matches = [...statsText.matchAll(/(\d+)/g)].map((match) => Number(match[1]));
    return {
      totalPages: matches[0] || NaN,
      totalItems: matches[1] || NaN,
    };
  };

  const parsePage = (html, fallbackPage) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const pageIndex = Number(doc.querySelector("#pageIndex")?.value || fallbackPage || 1);
    const { totalPages, totalItems } = parseStats(doc);
    const rows = [];

    for (const tr of doc.querySelectorAll("#dataList tr")) {
      const tds = [...tr.querySelectorAll("td")];
      if (tds.length < 11) continue;
      const links = [...tds[10].querySelectorAll("a")];
      rows.push({
        page: pageIndex,
        seq: text(tds[0]),
        course_name: text(tds[1]),
        course_name_en: text(tds[2]),
        course_code: text(tds[3]),
        offering_unit: text(tds[4]),
        course_category: text(tds[5]),
        course_nature: text(tds[6]),
        credits: text(tds[7]),
        hour_unit: text(tds[8]),
        total_hours: text(tds[9]),
        zh_outline_url: parseOutlineUrl(links[0]),
        en_outline_url: parseOutlineUrl(links[1]),
      });
    }

    return { pageIndex, totalPages, totalItems, rows };
  };

  const toCsv = (rows) => {
    const columns = [
      "page",
      "seq",
      "course_name",
      "course_name_en",
      "course_code",
      "offering_unit",
      "course_category",
      "course_nature",
      "credits",
      "hour_unit",
      "total_hours",
      "zh_outline_url",
      "en_outline_url",
    ];
    const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    return [
      columns.join(","),
      ...rows.map((row) => columns.map((col) => escape(row[col])).join(",")),
    ].join("\n");
  };

  const download = (filename, content, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const exportPayload = (payload, suffix = "") => {
    const tail = suffix ? `-${suffix}` : "";
    download(
      `bit-kcdg-courses${tail}.json`,
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8"
    );
    download(
      `bit-kcdg-courses${tail}.csv`,
      toCsv(payload.rows),
      "text/csv;charset=utf-8"
    );
  };

  const fetchPageHtml = async (action, formFields, page) => {
    const body = new URLSearchParams({ ...formFields, pageIndex: String(page) });
    const response = await fetch(action, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: body.toString(),
    });
    if (!response.ok) {
      throw new Error(`Page ${page} request failed: ${response.status}`);
    }
    return response.text();
  };

  const fetchPageWithRetry = async (action, formFields, page) => {
    let lastError = null;
    for (let attempt = 1; attempt <= RETRY_LIMIT; attempt += 1) {
      try {
        return await fetchPageHtml(action, formFields, page);
      } catch (error) {
        lastError = error;
        console.warn(`[kcdg] page ${page} failed on attempt ${attempt}/${RETRY_LIMIT}: ${error.message}`);
        if (attempt < RETRY_LIMIT) {
          await sleep(BASE_DELAY_MS * attempt);
        }
      }
    }
    throw lastError;
  };

  async function run() {
    const form = document.querySelector("#Form1");
    if (!form) {
      throw new Error("Form #Form1 not found on the current page.");
    }

    const first = parsePage(
      document.documentElement.outerHTML,
      Number(form.querySelector("#pageIndex")?.value || 1)
    );
    const totalPages = Number.isFinite(first.totalPages) ? first.totalPages : 1;
    const totalItems = Number.isFinite(first.totalItems) ? first.totalItems : first.rows.length;
    const action = form.action || location.href;
    const formFields = {
      skyx: form.querySelector('input[name="skyx"]')?.value || "",
      kch: form.querySelector('input[name="kch"]')?.value || "",
      kcmc: form.querySelector('input[name="kcmc"]')?.value || "",
    };
    const runKey = `${location.href}::${totalPages}::${totalItems}`;
    const db = await openDb();

    let rows = [];
    let startPage = 1;
    const checkpoint = await loadCheckpoint(db, runKey);
    const memoryPayload = window.__bitKcdgPayload;

    if (
      memoryPayload &&
      Array.isArray(memoryPayload.rows) &&
      memoryPayload.source_url === location.href &&
      memoryPayload.last_page >= 1
    ) {
      rows = memoryPayload.rows;
      startPage = memoryPayload.last_page + 1;
      console.log(`[kcdg] resume from memory page ${startPage}, saved rows=${rows.length}`);
    } else if (checkpoint && checkpoint.last_page >= 1) {
      rows = await loadRows(db, runKey);
      startPage = checkpoint.last_page + 1;
      console.log(`[kcdg] resume from page ${startPage}, saved rows=${rows.length}`);
    } else {
      rows = [...first.rows];
      startPage = 2;
      await saveCheckpoint(
        db,
        {
          runKey,
          source_url: location.href,
          total_pages: totalPages,
          total_items: totalItems,
          last_page: 1,
          updated_at: new Date().toISOString(),
        },
        first.rows
      );
      console.log(`[kcdg] start: totalPages=${totalPages}, totalItems=${totalItems}`);
    }

    for (let page = startPage; page <= totalPages; page += 1) {
      const html = await fetchPageWithRetry(action, formFields, page);
      const parsed = parsePage(html, page);
      rows.push(...parsed.rows);

      if (page % CHECKPOINT_EVERY === 0 || page === totalPages) {
        await saveCheckpoint(
          db,
          {
            runKey,
            source_url: location.href,
            total_pages: totalPages,
            total_items: totalItems,
            last_page: page,
            updated_at: new Date().toISOString(),
          },
          parsed.rows
        );
      }

      if (page % 25 === 0 || page === totalPages) {
        console.log(`[kcdg] page ${page}/${totalPages}, rows=${rows.length}`);
      }

      await sleep(BETWEEN_PAGES_MS);
    }

    const payload = {
      fetched_at: new Date().toISOString(),
      source_url: location.href,
      total_pages: totalPages,
      total_items: totalItems,
      rows_collected: rows.length,
      start_page: 1,
      last_page: totalPages,
      status: "completed",
      rows,
    };

    await clearCheckpoint(db, runKey);
    db.close();
    window.__bitKcdgPayload = payload;
    exportPayload(payload);
    console.log(`[kcdg] done: rows=${rows.length}/${totalItems}`);
    return payload;
  }

  return run();
})().catch(async (error) => {
  try {
    const DB_NAME = "__bit_kcdg_scrape_db__";
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const txMeta = db.transaction(["meta"], "readonly");
    const meta = await new Promise((resolve, reject) => {
      const req = txMeta.objectStore("meta").get("checkpoint");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    await new Promise((resolve, reject) => {
      txMeta.oncomplete = () => resolve();
      txMeta.onerror = () => reject(txMeta.error);
      txMeta.onabort = () => reject(txMeta.error);
    });

    if (meta && meta.runKey) {
      const txPages = db.transaction(["pages"], "readonly");
      const store = txPages.objectStore("pages");
      const pageEntries = [];
      await new Promise((resolve, reject) => {
        const req = store.openCursor();
        req.onsuccess = () => {
          const cursor = req.result;
          if (!cursor) {
            resolve();
            return;
          }
          if (cursor.value.runKey === meta.runKey) {
            pageEntries.push(cursor.value);
          }
          cursor.continue();
        };
        req.onerror = () => reject(req.error);
      });
      await new Promise((resolve, reject) => {
        txPages.oncomplete = () => resolve();
        txPages.onerror = () => reject(txPages.error);
        txPages.onabort = () => reject(txPages.error);
      });

      pageEntries.sort((a, b) => a.page - b.page);
      const rows = pageEntries.flatMap((entry) => entry.rows);
      const payload = {
        fetched_at: new Date().toISOString(),
        source_url: meta.source_url || location.href,
        total_pages: meta.total_pages || 0,
        total_items: meta.total_items || 0,
        rows_collected: rows.length,
        start_page: 1,
        last_page: meta.last_page || 0,
        status: "partial",
        error_message: error.message,
        rows,
      };
      window.__bitKcdgPayload = payload;

      const columns = [
        "page","seq","course_name","course_name_en","course_code","offering_unit",
        "course_category","course_nature","credits","hour_unit","total_hours",
        "zh_outline_url","en_outline_url"
      ];
      const csv = [
        columns.join(","),
        ...rows.map((row) =>
          columns.map((col) => `"${String(row[col] ?? "").replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      const save = (filename, content, type) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      };

      const suffix = `partial-page-${payload.last_page}`;
      save(`bit-kcdg-courses-${suffix}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
      save(`bit-kcdg-courses-${suffix}.csv`, csv, "text/csv;charset=utf-8");
      console.warn(`[kcdg] partial export saved through page ${payload.last_page}`);
    }

    db.close();
  } catch {
  }

  console.error("[kcdg] failed", error);
  throw error;
});
