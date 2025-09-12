"use client";

import { useEffect, useState } from "react";

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

interface ImgDia {
  show: boolean;
  url: string;
}

export default function Home() {
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
  const [img, setImg] = useState<ImgDia>({
    show: false,
    url: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    fetch("http://127.0.0.1:5000/api/file_list")
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
      alert(`ID ${id} convert success`);
    } catch (err) {
      console.error("Convert failed:", err);
      alert(`ID ${id} convert failed`);
    }
  };

  const handleSubmit = async () => {
    const data = new FormData();
    data.append("id", form.id?.toString() || "");
    data.append("name", form.name);
    data.append("prompt", form.prompt);
    if (form.imagePath) {
      data.append("image", form.imagePath); // 送 File
    }
    console.log(data);
    const res = await fetch("http://127.0.0.1:5000/edit", {
      method: "PUT",
      body: data,
    });
    const result = await res.json();
    console.log(result);
    setEdit(false);
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
    const url = await loadImg(id);
    if (url == "") {
      alert("failed");
      return;
    }
    setImg((v) => ({ ...v, ["url"]: url }));
    setImg((v) => ({ ...v, ["show"]: true }));
  };

  const loadImg = async (id: number) => {
    let url = "";
    setLoading(true);
    await fetch(`http://127.0.0.1:5000/image/${id}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        url = data.fullUrl;
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching table:", err);
        setLoading(false);
      });
    return url;
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">資料表</h1>

      {loading ? (
        <div className="text-gray-500">讀取中...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded-lg shadow">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">name</th>
                <th className="px-4 py-2 border">class</th>
                <th className="px-4 py-2 border">prompt</th>
                <th className="px-4 py-2 border">origin path</th>
                <th className="px-4 py-2 border">target path</th>
                <th className="px-4 py-2 border">-</th>
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
                      onClick={() => showImg(row.id)}
                      className={`text-white bg-green-500 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 ${
                        !row.img_exist ? "pointer-events-none opacity-50" : ""
                      }`}
                    >
                      image
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConvert(row.id)} // 綁定 row.id
                      className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2"
                    >
                      convert
                    </button>
                    <button
                      type="button"
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
                onChange={(e) => updateField("name", e.target.value)}
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
        <div className="fixed inset-0 flex items-center justify-center ">
          <div className="bg-cyan-500 p-6 rounded-lg max-w-[80vw] flex flex-col">
            <h2 className="text-lg font-bold mb-4">Img</h2>
            <div className="my-2 h-[50vh] overflow-y-scroll">
              <img src={img.url} alt="" />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setImg((v) => ({ ...v, ["show"]: false }))}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
