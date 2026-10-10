import { toast } from "@/stores/toast.store";

/** Native share sheet where available (mobile), clipboard otherwise. */
export async function shareLink(path: string, title: string): Promise<void> {
  const url = new URL(path, window.location.origin).toString();
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast("Link copied to clipboard");
  } catch {
    toast("Couldn't copy the link", "error");
  }
}
