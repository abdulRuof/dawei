"use client";

import { useState } from "react";
import './style.css'


import type { Category } from "./types";

interface Props {
  categories: Category[];
  setCategories: React.Dispatch<
    React.SetStateAction<Category[]>
  >;
  showToast: (message: string) => void;
  onAdd?: (category: Omit<Category, "id">) => Promise<void> | void;
  onUpdate?: (category: Category) => Promise<void> | void;
  onDelete?: (id: number) => Promise<void> | void;
}

export default function CategoriesManagement({
  categories,
  setCategories,
  showToast,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const [isAddOpen, setIsAddOpen] =
    useState(false);

  const [name, setName] =
    useState("");

  const [desc, setDesc] =
    useState("");

  const addCategory = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!name.trim()) return;

    if (onAdd) {
      try {
        await onAdd({
          name: name.trim(),
          desc: desc.trim(),
          count: 0,
        });
      } finally {
        setName("");
        setDesc("");
        setIsAddOpen(false);
      }
      return;
    }

    const newCategory: Category = {
      id: Date.now(),
      name: name.trim(),
      desc: desc.trim(),
      count: 0,
    };

    setCategories((prev) => [
      ...prev,
      newCategory,
    ]);

    setName("");
    setDesc("");
    setIsAddOpen(false);

    showToast(
      `✓ تمت إضافة تصنيف "${newCategory.name}"`
    );
  };

  const editCategory = async (
    category: Category
  ) => {
    const newName = window.prompt(
      "اسم التصنيف الجديد:",
      category.name
    );

    if (!newName?.trim()) return;

    if (onUpdate) {
      await onUpdate({
        ...category,
        name: newName.trim(),
      });
      return;
    }

    setCategories((prev) =>
      prev.map((c) =>
        c.id === category.id
          ? {
              ...c,
              name: newName.trim(),
            }
          : c
      )
    );

    showToast("✓ تم تعديل التصنيف");
  };

  const deleteCategory = async (
    category: Category
  ) => {
    if (onDelete) {
      await onDelete(category.id);
      return;
    }

    setCategories((prev) =>
      prev.filter(
        (c) => c.id !== category.id
      )
    );

    showToast(
      `🗑 تم حذف التصنيف "${category.name}"`
    );
  };

  return (
    <section>

      <div className="table-toolbar">

        <p className="section-hint">
          عدّل التصنيفات التي تظهر للمستخدمين
          في الصفحة الرئيسية.
        </p>

        <button
          type="button"
          className="btn btn--coral"
          onClick={() =>
            setIsAddOpen((prev) => !prev)
          }
        >
          + إضافة تصنيف
        </button>

      </div>

      {isAddOpen && (
        <form
          className="add-cat-form"
          onSubmit={addCategory}
        >
          <input
            type="text"
            placeholder="اسم التصنيف"
            required
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />

          <input
            type="text"
            placeholder="وصف مختصر"
            value={desc}
            onChange={(e) =>
              setDesc(e.target.value)
            }
          />

          <div className="add-med-form__actions">

            <button
              type="submit"
              className="btn btn--ghost"
            >
              حفظ التصنيف
            </button>

            <button
              type="button"
              className="btn btn--outline"
              onClick={() => {
                setIsAddOpen(false);
                setName("");
                setDesc("");
              }}
            >
              إلغاء
            </button>

          </div>
        </form>
      )}

      <div className="cat-admin-grid">

        {categories.map((category) => (
          <article
            className="cat-admin-card"
            key={category.id}
          >

            <div className="cat-admin-card__top">
              <span className="cat-admin-card__icon">
                💊
              </span>

              <span className="cat-admin-card__count">
                {category.count}+ دواء
              </span>
            </div>

            <div className="cat-admin-card__name">
              {category.name}
            </div>

            <p className="cat-admin-card__desc">
              {category.desc || "—"}
            </p>

            <div className="cat-admin-card__actions">

              <button
                type="button"
                className="cat-edit"
                onClick={() =>
                  editCategory(category)
                }
              >
                تعديل
              </button>

              <button
                type="button"
                className="cat-delete"
                onClick={() =>
                  deleteCategory(category)
                }
              >
                حذف
              </button>

            </div>

          </article>
        ))}

      </div>

    </section>
  );
}