import { z } from "zod";

// File validation
export const fileValidationSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 50 * 1024 * 1024, "File size must be less than 50MB")
    .refine(
      (file) => ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"].includes(file.type),
      "File must be an Excel file (.xlsx or .xls)"
    ),
});

// Review save validation
export const reviewSaveSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
});

// Email validation
export const emailSchema = z.string().email("Please enter a valid email address");

// PDF file validation
export const pdfFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 100 * 1024 * 1024, "PDF file size must be less than 100MB")
  .refine((file) => file.type === "application/pdf", "File must be a PDF");

// KMZ file validation
export const kmzFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 50 * 1024 * 1024, "KMZ file size must be less than 50MB")
  .refine(
    (file) => file.name.endsWith(".kmz") || file.type === "application/vnd.google-earth.kmz",
    "File must be a KMZ file"
  );

export type ReviewSaveInput = z.infer<typeof reviewSaveSchema>;
