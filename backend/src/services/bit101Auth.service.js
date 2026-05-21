const crypto = require('crypto')

const BIT101_API_BASE = process.env.BIT101_API_BASE || 'https://bit101.flwfdd.xyz'

async function requestBit101(path, options = {}) {
  const response = await fetch(`${BIT101_API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  const text = await response.text()
  let data = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = {
        msg: text
      }
    }
  }

  if (!response.ok) {
    const message =
      data?.msg ||
      data?.message ||
      `BIT101 request failed with status ${response.status}`
    const error = new Error(message)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

function md5(value) {
  return crypto.createHash('md5').update(value).digest('hex')
}

function randomString(length) {
  const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'
  let result = ''

  for (let index = 0; index < length; index += 1) {
    const randomIndex = crypto.randomInt(0, chars.length)
    result += chars[randomIndex]
  }

  return result
}

function normalizeAesKey(salt) {
  const key = Buffer.from(String(salt || ''), 'utf8')

  if ([16, 24, 32].includes(key.length)) {
    return key
  }

  if (key.length < 16) {
    return Buffer.concat([key, Buffer.alloc(16 - key.length)])
  }

  if (key.length < 24) {
    return Buffer.concat([key.subarray(0, key.length), Buffer.alloc(24 - key.length)])
  }

  if (key.length < 32) {
    return Buffer.concat([key.subarray(0, key.length), Buffer.alloc(32 - key.length)])
  }

  return key.subarray(0, 32)
}

function encryptPassword(password, salt) {
  if (!salt) {
    return password
  }

  const key = normalizeAesKey(salt)
  const iv = key.subarray(0, 16)
  const algorithm = `aes-${key.length * 8}-cbc`
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  const plainText = `${randomString(64)}${password}`

  let encrypted = cipher.update(plainText, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  return encrypted
}

async function fetchProfile(fakeCookie) {
  try {
    const infoData = await requestBit101('/user/info/0', {
      method: 'GET',
      headers: {
        'fake-cookie': fakeCookie
      }
    })

    return infoData?.user || null
  } catch {
    return null
  }
}

async function loginWithMd5Password(sid, password) {
  const loginData = await requestBit101('/user/login', {
    method: 'POST',
    body: JSON.stringify({
      sid,
      password: md5(password)
    })
  })

  return {
    fakeCookie: loginData.fake_cookie,
    profile: await fetchProfile(loginData.fake_cookie)
  }
}

async function loginWithBitAccount(sid, password) {
  try {
    return await loginWithMd5Password(sid, password)
  } catch {
    const initData = await requestBit101('/user/webvpn_verify_init', {
      method: 'POST',
      body: JSON.stringify({ sid })
    })

    const verifyData = await requestBit101('/user/webvpn_verify', {
      method: 'POST',
      headers: {
        Cookie: initData.cookie || ''
      },
      body: JSON.stringify({
        sid,
        password: encryptPassword(password, initData.salt),
        captcha: '',
        execution: initData.execution,
        _eventId: 'submit'
      })
    })

    const registerData = await requestBit101('/user/register', {
      method: 'POST',
      body: JSON.stringify({
        password: md5(password),
        token: verifyData.token,
        code: verifyData.code,
        login_mode: true
      })
    })

    return {
      fakeCookie: registerData.fake_cookie,
      profile: await fetchProfile(registerData.fake_cookie)
    }
  }
}

module.exports = {
  loginWithBitAccount
}
