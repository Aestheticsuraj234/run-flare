const decoder = new TextDecoder();

export function decodeBase64ToUint8Array(data: string): Uint8Array {
  const binary = atob(data);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i);
  }
  return arr;
}

export function parseAdditionalFilesPayload(raw: string): any[] {
  let parsed: any;
  try {
    const jsonString = decoder.decode(decodeBase64ToUint8Array(raw));
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new Error("additional_files must be valid base64-encoded JSON");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("additional_files payload must be a JSON array");
  }

  const normalized = parsed
    .map((file: any) => {
      if (!file || typeof file.path !== "string" || !file.path.trim()) {
        return null;
      }

      const additionalFile: any = { path: file.path.trim() };
      const base64Content =
        typeof file.contentBase64 === "string"
          ? file.contentBase64
          : typeof file.content_base64 === "string"
            ? file.content_base64
            : undefined;

      if (typeof file.content === "string") additionalFile.content = file.content;
      if (base64Content) additionalFile.contentBase64 = base64Content;

      if (!additionalFile.content && !additionalFile.contentBase64) {
        additionalFile.content = "";
      }

      return additionalFile;
    })
    .filter((file): file is any => Boolean(file));

  return normalized.length ? normalized : [];
}

export function hasNonUtf8Characters(text: string | null): boolean {
  if (!text) return false;
  return !/^[\x00-\x7F]*$/.test(text);
}

export function normalizeToUtf8String(value: unknown): string {
  const decoder = new TextDecoder();
  if (typeof value === "string") return value;
  if (value instanceof ArrayBuffer) return decoder.decode(new Uint8Array(value));
  if (ArrayBuffer.isView(value)) return decoder.decode(new Uint8Array(value.buffer));
  if (value && typeof value === "object") {
    const maybeBuffer = value as { type?: string; data?: ArrayLike<number> };
    if (maybeBuffer.type === "Buffer" && Array.isArray(maybeBuffer.data)) {
      return decoder.decode(Uint8Array.from(maybeBuffer.data));
    }
  }
  return value == null ? "" : String(value);
}

