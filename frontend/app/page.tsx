"use client";

import { useEffect, useState } from "react";

interface Search {
  name: string;
  class: string;
  prompt: string;
  file_name: string;
}
interface TableRow {
  id: number;
  name: string;
  class: string;
  prompt: string;
  origin_path: string | null;
  target_path: string | null;
  img_exist: boolean;
}

interface FormData {
  id: number | null;
  name: string;
  class: string;
  prompt: string;
  imagePath: File | null;
}

interface FormImg {
  show: boolean;
  file_list_id: number | null;
  imagePath: File | null;
}

interface ImgDia {
  show: boolean;
  urls: string[];
  selectedIndex: number;
}

export default function Home() {
  const [search, setSearch] = useState<Search>({
    name: "",
    class: "",
    prompt: "",
    file_name: "",
  });
  const [rows, setRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<FormData>({
    id: null,
    name: "",
    class: "",
    prompt: "",
    imagePath: null,
  });
  const [formImg, setFormImg] = useState<FormImg>({
    show: false,
    file_list_id: null,
    imagePath: null,
  });
  const [img, setImg] = useState<ImgDia>({
    show: false,
    urls: [], // 改成陣列存放多張圖片
    selectedIndex: -1, // 記錄當前選中的圖片索引
  });

  useEffect(() => {
    loadData();
  }, []);

  const updateSearch = (key: keyof Search, value: string | number | File) => {
    setSearch((prev) => ({ ...prev, [key]: value }));
  };

  const loadData = () => {
    setLoading(true);

    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(search).filter(([_, v]) => v !== ""))
    ).toString();

    fetch(`http://127.0.0.1:5000/api/file_list?${query}`)
      .then((res) => res.json())
      .then((data) => {
        setRows(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching table:", err);
        setLoading(false);
      });
  };
  // 🔹 convert function
  const handleConvert = async (id: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/convert`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const result = await res.json();
      console.log("Convert success:", result);

      // 可以視情況更新 rows
      loadData();
    } catch (err) {
      console.error("Convert failed:", err);
      alert(`ID ${id} convert failed`);
    }
  };

  // 🔹 convert function
  const handleClear = async (id: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/clear`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const result = await res.json();
      console.log("Clear success:", result);

      // 可以視情況更新 rows
      loadData();
    } catch (err) {
      console.error("clear failed:", err);
      alert(`ID ${id} clear failed`);
    }
  };

  const handleSubmit = async () => {
    const data = {
      id: form.id?.toString() || "",
      name: form.name,
      class_name: form.class, // 注意這裡不要用 class，避免保留字衝突
      prompt: form.prompt,
    };
    console.log(data);
    const res = await fetch("http://127.0.0.1:5000/edit", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    console.log(result);
    setEdit(false);
    loadData();
  };

  const showFormImg = async (id: number) => {
    setFormImg((v) => ({ ...v, ["show"]: true, ["file_list_id"]: id }));
  };

  const saveImage = async () => {
    const data = new FormData();
    data.append("file_list_id", formImg.file_list_id?.toString() || "");
    if (formImg.imagePath) {
      data.append("image", formImg.imagePath); // 送 File
    } else {
      return;
    }
    console.log(data);
    const res = await fetch("http://127.0.0.1:5000/image", {
      method: "POST",
      body: data,
    });
    const result = await res.json();
    console.log(result);
    setFormImg((v) => ({ ...v, ["show"]: false, ["file_list_id"]: null }));
    loadData();
  };

  const showEdit = (id: number) => {
    setEdit(true);
    updateField("id", id);
  };

  const updateField = (key: keyof FormData, value: string | number | File) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const showImg = async (id: number) => {
    const img_list = await loadImg(id);
    if (img_list.length == 0) {
      alert("failed");
      return;
    }
    console.log(img_list);
    setImg({
      show: true,
      urls: img_list.map((img) => img.fullUrl), // 存入所有圖片 URL
      selectedIndex: -1, // 初始顯示縮圖列表
    });
  };

  const loadImg = async (id: number) => {
    let img_list: any[] = [];
    setLoading(true);
    await fetch(`http://127.0.0.1:5000/image/${id}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        img_list = data.images;
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching table:", err);
        setLoading(false);
      });
    return img_list;
  };

  return (
    <div className="p-8">
      <div className="flex items-stretch">
        <div className="my-2 mx-2 bg-cyan-300 rounded-md shadow-lg px-8 py-4">
          <span className="text-xl font-bold">name</span>
          <input
            type="text"
            className="bg-white w-full p-1"
            value={search.name}
            onChange={(e) => updateSearch("name", e.target.value)}
          />
        </div>
        <div className="my-2 mx-2 bg-cyan-300 rounded-md shadow-lg px-8 py-4">
          <span className="text-xl font-bold">class</span>
          <input
            type="text"
            className="bg-white w-full p-1"
            value={search.class}
            onChange={(e) => updateSearch("class", e.target.value)}
          />
        </div>
        <div className="my-2 mx-2 bg-cyan-300 rounded-md shadow-lg px-8 py-4">
          <span className="text-xl font-bold">prompt</span>
          <input
            type="text"
            className="bg-white w-full p-1"
            value={search.prompt}
            onChange={(e) => updateSearch("prompt", e.target.value)}
          />
        </div>
        <div className="my-2 mx-2 bg-cyan-300 rounded-md shadow-lg px-8 py-4">
          <span className="text-xl font-bold">file_name</span>
          <input
            type="text"
            className="bg-white w-full p-1"
            value={search.file_name}
            onChange={(e) => updateSearch("file_name", e.target.value)}
          />
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => loadData()}
            className="text-white bg-sky-500 hover:bg-sky-800 focus:outline-none focus:ring-4 focus:ring-sky-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-sky-600 dark:hover:bg-sky-700 dark:focus:ring-sky-800 cursor-pointer"
          >
            search
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96 text-gray-500 text-lg">
          讀取中...
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg shadow overflow-hidden">
          <div className="overflow-auto max-h-[calc(100vh-230px)]">
            <table className="min-w-full">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 border bg-gray-100">name</th>
                  <th className="px-4 py-2 border bg-gray-100">class</th>
                  <th className="px-4 py-2 border bg-gray-100">prompt</th>
                  <th className="px-4 py-2 border bg-gray-100">origin path</th>
                  <th className="px-4 py-2 border bg-gray-100">target path</th>
                  <th className="px-4 py-2 border bg-gray-100">-</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border text-center">
                      {row.name ?? ""}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {row.class ?? ""}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {row.prompt ?? ""}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {row.origin_path ?? ""}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {row.target_path ?? ""}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      <button
                        type="button"
                        onClick={() => showEdit(row.id)}
                        className="text-white bg-cyan-500 hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-cyan-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-cyan-600 dark:hover:bg-cyan-700 dark:focus:ring-cyan-800"
                      >
                        edit
                      </button>
                      <button
                        type="button"
                        onClick={() => showFormImg(row.id)}
                        className="text-white bg-orange-500 hover:bg-orange-800 focus:outline-none focus:ring-4 focus:ring-orange-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800"
                      >
                        upload
                      </button>
                      <button
                        type="button"
                        onClick={() => showImg(row.id)}
                        className={`text-white bg-green-500 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 ${
                          !row.img_exist ? "pointer-events-none opacity-50" : ""
                        }`}
                      >
                        image
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConvert(row.id)}
                        className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2"
                      >
                        convert
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClear(row.id)}
                        className="text-white bg-red-500 hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
                      >
                        clear
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {edit && (
        <div className="fixed inset-0 flex items-center justify-center ">
          <div className="bg-cyan-500 p-6 rounded-lg w-96 flex flex-col">
            <h2 className="text-lg font-bold mb-4">Edit</h2>
            <div className="my-2">
              <span>name</span>
              <input
                type="text"
                className="bg-white w-full p-1"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </div>
            <div className="my-2">
              <span>class</span>
              <input
                type="text"
                className="bg-white w-full p-1"
                value={form.class}
                onChange={(e) => updateField("class", e.target.value)}
              />
            </div>
            <div className="my-2">
              <span>prompt</span>
              <textarea
                className="bg-white w-full p-1"
                value={form.prompt}
                onChange={(e) => updateField("prompt", e.target.value)}
              />
            </div>
            <div className="my-2">
              <span>imagePath</span>
              <input
                type="file"
                accept=".png" // 限制只能選 PNG
                className="bg-white w-full p-1"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    updateField("imagePath", file); // 改存 File 物件，而不是字串
                  }
                }}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setEdit(false)}
              >
                Cancel
              </button>
              <button
                className="bg-cyan-600 text-white px-4 py-2 rounded"
                onClick={handleSubmit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {img.show && (
        <div className="fixed inset-0 flex items-center justify-center  z-50">
          <div className="bg-cyan-500 p-6 rounded-lg max-w-[80vw] max-h-[80vh] flex flex-col">
            <h2 className="text-lg font-bold mb-4">
              {img.selectedIndex === -1 ? "Image Gallery" : "Image Preview"}
            </h2>

            {/* 縮圖列表視圖 */}
            {img.selectedIndex === -1 ? (
              <div className="my-2 h-[50vh] overflow-y-auto">
                <div className="grid grid-cols-3 gap-4">
                  {img.urls.map((url, index) => (
                    <div
                      key={index}
                      className="cursor-pointer hover:opacity-80 transition-opacity border-2 border-white rounded overflow-hidden aspect-square"
                      onClick={() =>
                        setImg((v) => ({ ...v, selectedIndex: index }))
                      }
                    >
                      <img
                        src={url}
                        alt={`Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* 大圖預覽視圖 */
              <div className="my-2 h-[50vh] overflow-auto flex items-center justify-center">
                <img
                  src={img.urls[img.selectedIndex]}
                  alt={`Image ${img.selectedIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}

            <div className="flex justify-between items-center space-x-2 mt-4">
              {/* 返回按鈕 (只在大圖模式顯示) */}
              {img.selectedIndex !== -1 && (
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  onClick={() => setImg((v) => ({ ...v, selectedIndex: -1 }))}
                >
                  ← Back to Gallery
                </button>
              )}

              <div className="flex-1"></div>

              {/* 關閉按鈕 */}
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                onClick={() =>
                  setImg({ show: false, urls: [], selectedIndex: -1 })
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {formImg.show && (
        <div className="fixed inset-0 flex items-center justify-center ">
          <div className="bg-cyan-500 p-6 rounded-lg w-96 flex flex-col">
            <h2 className="text-lg font-bold mb-4">Save Image</h2>
            <div className="my-2">
              <span>imagePath {formImg.file_list_id ?? "none"}</span>
              <input
                type="file"
                accept=".png" // 限制只能選 PNG
                className="bg-white w-full p-1"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormImg((v) => ({ ...v, ["imagePath"]: file })); // 改存 File 物件，而不是字串
                  }
                }}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setFormImg((v) => ({ ...v, ["show"]: false }))}
              >
                Cancel
              </button>
              <button
                className="bg-cyan-600 text-white px-4 py-2 rounded"
                onClick={saveImage}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
