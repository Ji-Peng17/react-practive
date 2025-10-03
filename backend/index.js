import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import fs from "fs";
import path from "path";
import multer from "multer";
import _ from "lodash";
import { fileURLToPath } from "url";

// __dirname 在 ESM 中沒有，需要自己模擬
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// 配置靜態文件服務 - 讓 public 目錄可以被直接訪問
app.use("/static", express.static(path.join(__dirname, "public")));

// 連線 MySQL
const db = await mysql.createConnection({
  host: "127.0.0.1",
  user: "sa", // 根據你的 phpMyAdmin 帳號
  password: "sun", // 如果有密碼要填
  database: "ttt", // 你在 phpMyAdmin 建好的資料庫
});

// 指定資料夾路徑
const FILE_DIRECTORY = "D:\\ttt\\file_path";
const FILE_NEW_DIRECTORY = "D:\\ttt\\file_new_path";

// 設定暫存上傳位置
const upload = multer({ dest: "uploads/" });

// 測試 API
app.get("/api/hello", (req, res) => {
  const arr = [1, 2, 2, 3, 4, 4, 5];
  const uni = _.uniq(arr); // => [1, 2, 3, 4, 5]
  res.json({ message: uni });
});

// 查詢 MySQL 測試
app.get("/api/t_table", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM t_table");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/file_list", async (req, res) => {
  try {
    const { name, class: className, prompt, file_name } = req.query; // 從 query string 接收條件

    let sql = `
    SELECT *, CASE WHEN 1 = 1 THEN 1 ELSE 0 END AS img_exist
    FROM file_list
    WHERE 1=1
  `;
    const params = [];

    if (name && name.trim() !== "") {
      sql += " AND name LIKE ?";
      params.push(`%${name}%`);
    }

    if (className && className.trim() !== "") {
      sql += " AND class LIKE ?";
      params.push(`%${className}%`);
    }

    if (prompt && prompt.trim() !== "") {
      sql += " AND prompt LIKE ?";
      params.push(`%${prompt}%`);
    }

    if (file_name && file_name.trim() !== "") {
      sql += " AND file_name LIKE ?";
      params.push(`%${file_name}%`);
    }
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//根據 ID 獲取圖片路徑
app.get("/image/:id", async (req, res) => {
  try {
    const reqId = req.params.id;

    const [results] = await db.query(
      "SELECT image FROM file_image WHERE file_list_id = ?",
      [reqId]
    );

    if (results.length === 0) {
      return res.status(404).json({ error: "圖片不存在" });
    }

    const images = results
      .map((row) => {
        const imagePath = row.image;
        const fullPath = path.join(__dirname, "public", imagePath);

        if (!fs.existsSync(fullPath)) return null;

        const imageUrl = `/static/${imagePath}`;
        return {
          imageUrl,
          fullUrl: `${req.protocol}://${req.get("host")}${imageUrl}`,
        };
      })
      .filter(Boolean);

    if (images.length === 0) {
      return res.status(404).json({ error: "圖片文件不存在" });
    }

    res.json({
      success: true,
      images,
    });
  } catch (err) {
    console.error("資料庫錯誤:", err);
    res.status(500).json({ error: "伺服器錯誤" });
  }
});

// POST API 端點 - 同步檔案與資料庫
app.post("/sync_files", async (req, res) => {
  try {
    // 檢查目錄是否存在
    if (!fs.existsSync(FILE_DIRECTORY)) {
      return res.status(400).json({
        success: false,
        message: "指定資料夾不存在",
      });
    }

    // 遞歸讀取資料夾內的所有檔案（包含子資料夾）
    function getAllFiles(dirPath, arrayOfFiles = []) {
      const files = fs.readdirSync(dirPath, { withFileTypes: true });

      files.forEach((dirent) => {
        const fullPath = path.join(dirPath, dirent.name);

        if (dirent.isDirectory()) {
          // 如果是資料夾，遞歸讀取
          getAllFiles(fullPath, arrayOfFiles);
        } else if (dirent.isFile()) {
          // 如果是檔案，加入陣列
          arrayOfFiles.push(fullPath);
        }
      });

      return arrayOfFiles;
    }

    // 取得所有檔案的完整路徑（包含子資料夾）
    const filePaths = getAllFiles(FILE_DIRECTORY);

    // 查詢現有資料庫中的 origin_path
    const [existingFilesRows] = await db.query(
      "SELECT origin_path FROM file_list"
    );
    const existingFiles = existingFilesRows.map((row) => row.origin_path);

    // 找出需要新增的檔案（資料夾中存在但資料庫中不存在）
    const newFiles = filePaths.filter(
      (filePath) => !existingFiles.includes(filePath)
    );

    // 批量插入新檔案到資料庫
    if (newFiles.length > 0) {
      const insertQuery =
        "INSERT INTO file_list (origin_path, file_name, created_at) VALUES ?";
      const insertValues = newFiles.map((filePath) => {
        const fileName = path.basename(filePath);
        return [filePath, fileName, new Date()];
      });

      await db.query(insertQuery, [insertValues]);
    }

    // 檢查資料庫中的檔案是否在實際資料夾中存在，更新 path_check 狀態
    const updatePromises = existingFiles.map(async (filePath) => {
      const fileExists = fs.existsSync(filePath);
      const pathCheckValue = fileExists ? 1 : 0;

      const updateQuery =
        "UPDATE file_list SET path_check = ?, updated_at = ? WHERE origin_path = ?";
      return db.query(updateQuery, [pathCheckValue, new Date(), filePath]);
    });

    await Promise.all(updatePromises);

    // 取得統計資訊
    const stats = {
      totalFilesInDirectory: filePaths.length,
      newFilesAdded: newFiles.length,
      totalFilesInDatabase: existingFiles.length + newFiles.length,
    };

    // 取得遺失檔案的統計
    const [missingFilesResult] = await db.query(
      "SELECT COUNT(*) as count FROM file_list WHERE path_check = 0"
    );
    stats.missingFiles = missingFilesResult[0].count;

    res.json({
      success: true,
      message: "檔案同步完成",
      stats: stats,
    });
  } catch (error) {
    console.error("檔案同步錯誤:", error);
    res.status(500).json({
      success: false,
      message: "檔案同步失敗",
      error: error.message,
    });
  }
});

app.put("/convert", async (req, res) => {
  try {
    const { id } = req.body;

    // 檢查是否有傳入 id
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "請提供檔案 ID",
      });
    }

    // 查詢資料庫中的 origin_path 和 name
    let sql = "SELECT origin_path, name FROM file_list WHERE id = ?";
    const [fileData] = await db.query(sql, [id]);

    // 檢查是否找到檔案記錄
    if (fileData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "找不到指定的檔案記錄",
      });
    }

    const { origin_path, name: file_name } = fileData[0];

    // 將 origin_path 前面的 FILE_DIRECTORY 代換成 FILE_NEW_DIRECTORY
    const newPath = origin_path.replace(FILE_DIRECTORY, FILE_NEW_DIRECTORY);

    // 檢查新路徑的檔案是否已存在
    if (fs.existsSync(newPath)) {
      return res.json({
        success: false,
        message: "檔案已存在",
        original_path: origin_path,
        new_path: newPath,
        file_name: file_name,
      });
    }

    // 確保目標資料夾存在
    const targetDir = path.dirname(newPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 複製檔案到新位置
    fs.copyFileSync(origin_path, newPath);

    let u_sql =
      "UPDATE file_list SET target_path = ?, updated_at = ? WHERE id = ?";
    await db.query(u_sql, [newPath, new Date(), id]);

    // 回傳成功訊息
    res.json({
      success: true,
      message: "檔案轉換成功",
      original_path: origin_path,
      new_path: newPath,
      file_name: file_name,
    });
  } catch (error) {
    console.error("檔案轉換錯誤:", error);

    // 處理不同類型的錯誤
    let errorMessage = "檔案轉換失敗";
    if (error.code === "ENOENT") {
      errorMessage = "來源檔案不存在";
    } else if (error.code === "EACCES") {
      errorMessage = "權限不足，無法存取檔案";
    } else if (error.code === "ENOSPC") {
      errorMessage = "磁碟空間不足";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
    });
  }
});

// PUT 方法：清除
app.put("/clear", async (req, res) => {
  try {
    const { id } = req.body;

    // 檢查是否有傳入 id
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "請提供檔案 ID",
      });
    }

    // 查詢取得 target_path
    const sql = "SELECT target_path FROM file_list WHERE id = ?";

    const [rows] = await db.query(sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "找不到記錄" });
    }

    const targetPath = rows[0].target_path;

    if (!targetPath) {
      return res.json({ success: true, message: "已經是清除狀態" });
    }

    // 刪除實體文件
    const fullPath = path.join(__dirname, "public", targetPath);

    if (fs.existsSync(targetPath)) {
      try {
        fs.unlinkSync(targetPath);
      } catch (deleteErr) {
        console.error("文件刪除失敗:", deleteErr);
      }
    }

    // 更新 target_path 為 null
    const u_sql = "UPDATE file_list SET target_path = NULL WHERE id = ?";

    await db.query(u_sql, [id]);

    res.json({
      success: true,
      message: "清除完成",
      id: id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/edit", async (req, res) => {
  try {
    const { id, name, class_name, prompt } = req.body;

    let u_sql = `UPDATE file_list
      SET name = ?, class = ?, prompt = ?, updated_at = ?
    WHERE id = ?`;
    await db.query(u_sql, [name, class_name, prompt, new Date(), id]);
    const abc = "123";

    return res.json({ success: true, id: abc });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/image", upload.single("image"), async (req, res) => {
  try {
    const { file_list_id } = req.body;
    const file = req.file; // multer 幫你處理的檔案

    const [results] = await db.query(
      `SELECT MAX(sort) AS sort FROM file_image WHERE file_list_id=?`,
      [file_list_id]
    );

    let sort = results[0].sort ? results[0].sort + 1 : 1;

    let imagePath = null;

    if (file) {
      const sort_str = sort.toString().padStart(3, "0");
      // 新檔名
      const newFileName = `img${file_list_id}_${sort_str}.png`;
      const destPath = path.join(__dirname, "public", "images", newFileName);

      // 確保資料夾存在
      fs.mkdirSync(path.dirname(destPath), { recursive: true });

      // 搬檔案到 public/images 下
      fs.renameSync(file.path, destPath);

      // 存資料庫的路徑（Next.js 可直接訪問 /images/xxx.png）
      imagePath = `/images/${newFileName}`;
    }

    // 更新資料庫
    const u_sql = `
        INSERT INTO file_image
        (file_list_id, image, sort, created_at, updated_at)
        VALUES (?,?,?,?,?)
      `;
    await db.query(u_sql, [
      file_list_id,
      imagePath,
      sort,
      new Date(),
      new Date(),
    ]);

    return res.json({
      success: true,
      image: imagePath,
      id: file_list_id,
      result: results,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(5000, () => console.log("Backend running on http://127.0.0.1:5000"));
