import { Router } from 'express'
import multer, { diskStorage } from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import { requireAdmin } from '../../middleware/auth'
import { success, error } from '../../utils/response'

export const uploadRouter = Router()

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads')

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// Multer storage config (v2 API)
const storage = diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const name = `${uuidv4()}${ext}`
    cb(null, name)
  },
})

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  const ext = path.extname(file.originalname).toLowerCase()
  if (allowed.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed (jpg, png, gif, webp, svg)'))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
})

// POST /api/admin/upload — single image
uploadRouter.post('/', requireAdmin, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json(error('File too large (max 5MB)'))
        }
        return res.status(400).json(error(err.message))
      }
      return res.status(400).json(error(err.message || 'Upload failed'))
    }

    try {
      if (!req.file) {
        return res.status(400).json(error('No file uploaded'))
      }
      const url = `/uploads/${req.file.filename}`
      res.json(success({
        url,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      }, 'File uploaded'))
    } catch (err: any) {
      res.status(500).json(error(err.message || 'Upload failed'))
    }
  })
})

// POST /api/admin/upload/multiple — up to 10 images
uploadRouter.post('/multiple', requireAdmin, (req, res, next) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json(error('File too large (max 5MB)'))
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json(error('Too many files (max 10)'))
        }
        return res.status(400).json(error(err.message))
      }
      return res.status(400).json(error(err.message || 'Upload failed'))
    }

    try {
      const files = req.files as Express.Multer.File[]
      if (!files || files.length === 0) {
        return res.status(400).json(error('No files uploaded'))
      }
      const uploaded = files.map((f) => ({
        url: `/uploads/${f.filename}`,
        filename: f.filename,
        originalName: f.originalname,
        size: f.size,
        mimetype: f.mimetype,
      }))
      res.json(success(uploaded, `${uploaded.length} file(s) uploaded`))
    } catch (err: any) {
      res.status(500).json(error(err.message || 'Upload failed'))
    }
  })
})

// DELETE /api/admin/upload/:filename — remove uploaded file
uploadRouter.delete('/:filename', requireAdmin, async (req, res) => {
  try {
    const { filename } = req.params
    // Prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json(error('Invalid filename'))
    }
    const filePath = path.join(UPLOAD_DIR, filename)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json(error('File not found'))
    }
    fs.unlinkSync(filePath)
    res.json(success(null, 'File deleted'))
  } catch (err: any) {
    res.status(500).json(error(err.message || 'Delete failed'))
  }
})

// GET /api/admin/upload — list all uploaded files
uploadRouter.get('/', requireAdmin, async (req, res) => {
  try {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    const files = fs.readdirSync(UPLOAD_DIR)
      .filter((f) => allowedExts.includes(path.extname(f).toLowerCase()))
      .map((f) => {
        const stat = fs.statSync(path.join(UPLOAD_DIR, f))
        return {
          filename: f,
          url: `/uploads/${f}`,
          size: stat.size,
          createdAt: stat.birthtime.toISOString(),
        }
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    res.json(success(files, `${files.length} file(s)`))
  } catch (err: any) {
    res.status(500).json(error(err.message || 'Failed to list files'))
  }
})