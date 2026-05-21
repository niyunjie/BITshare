const express = require('express')

const { loginWithBitAccount } = require('../services/bit101Auth.service')

const router = express.Router()

router.post('/login', async (req, res) => {
  const sid = String(req.body?.sid || '').trim()
  const password = String(req.body?.password || '')

  if (!sid || !password) {
    res.status(400).json({
      code: 1,
      message: '学号和密码不能为空'
    })
    return
  }

  try {
    const result = await loginWithBitAccount(sid, password)

    res.json({
      code: 0,
      data: {
        sid,
        fakeCookie: result.fakeCookie,
        user: result.profile
          ? {
              id: result.profile.id,
              nickname: result.profile.nickname,
              avatar: result.profile.avatar?.url || '',
              motto: result.profile.motto || ''
            }
          : {
              id: sid,
              nickname: sid,
              avatar: '',
              motto: ''
            }
      }
    })
  } catch (error) {
    res.status(error.status || 500).json({
      code: 1,
      message: error.message || '登录失败'
    })
  }
})

module.exports = router
