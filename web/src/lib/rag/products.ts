// Danh mục phần mềm (dùng cho bộ chọn + tự định tuyến + nhãn). Dữ liệu THUẦN -> dễ test.
// THÊM PHẦN MỀM MỚI: thêm 1 ProductDef vào đây (cho định tuyến/nhãn) rồi tạo drive_sources
// với product = id tương ứng và đồng bộ — worker không cần sửa.

export interface ProductDef {
  id: string;
  label: string;
  description: string;
  keywords: string[];
}

export const PRODUCTS: ProductDef[] = [
  {
    id: "pmt-ems",
    label: "PMT-EMS (Quản lý đào tạo)",
    description: "Phần mềm quản lý đào tạo PMT-EMS của ASC.",
    keywords: [
      "pmt-ems", "pmt", "ems", "quản lý đào tạo",
      "nhập điểm", "xem điểm", "bảng điểm", "kết quả học tập",
      "học phần", "tín chỉ", "thời khóa biểu", "đăng ký học phần",
    ],
  },
  {
    id: "google-workspace",
    label: "Email & Google Workspace",
    description: "Email nhà trường, Google Drive, Calendar, Meet.",
    keywords: [
      "email", "gmail", "hộp thư", "google drive", "google calendar",
      "lịch google", "google meet", "workspace", "tài khoản google",
    ],
  },
  {
    id: "tuyen-sinh",
    label: "Tuyển sinh",
    description: "Thông tin tuyển sinh: ngành, điểm chuẩn, chỉ tiêu, học phí, hồ sơ.",
    keywords: [
      "tuyển sinh", "xét tuyển", "điểm chuẩn", "chỉ tiêu", "nguyện vọng",
      "ngành", "học phí", "hồ sơ xét tuyển", "đăng ký xét tuyển", "phương thức xét tuyển",
    ],
  },
];

export function getProduct(id?: string | null): ProductDef | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

/**
 * Tự định tuyến phần mềm từ câu hỏi (đếm từ khóa khớp). Trả về id phần mềm khớp nhất,
 * hoặc null nếu không rõ (khi đó truy hồi trên mọi phần mềm).
 */
export function classifyProduct(question: string, products: ProductDef[] = PRODUCTS): string | null {
  const q = question.toLowerCase();
  let best: { id: string; score: number } | null = null;
  for (const p of products) {
    let score = 0;
    for (const kw of p.keywords) {
      if (q.includes(kw.toLowerCase())) score += 1;
    }
    if (score > 0 && (best === null || score > best.score)) {
      best = { id: p.id, score };
    }
  }
  return best ? best.id : null;
}


// ---- Danh mục ĐỘNG cho bộ chọn (gộp danh mục cứng + product đang có nội dung trong kho) ----
export interface ProductOption {
  id: string;
  label: string;
}

/** Biến slug "sach-giao-khoa" -> "Sach Giao Khoa" (nhãn tạm cho product mới chưa có nhãn cứng). */
export function prettifySlug(id: string): string {
  return id
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Gộp danh mục cứng (nhãn đẹp + có định tuyến) với các product ĐANG CÓ nội dung trong kho.
 * Nhờ vậy: thêm nguồn Drive mới + đồng bộ có dữ liệu -> collection tự hiện trong bộ chọn.
 */
export function mergeProductOptions(activeIds: string[]): ProductOption[] {
  const out: ProductOption[] = [];
  const seen = new Set<string>();
  for (const p of PRODUCTS) {
    out.push({ id: p.id, label: p.label });
    seen.add(p.id);
  }
  for (const id of activeIds) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label: prettifySlug(id) });
  }
  return out;
}
