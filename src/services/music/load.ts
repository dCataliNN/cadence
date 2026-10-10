import "server-only";
import { notFound } from "next/navigation";
import { isNotFound } from "./music.service";

/** Resolves catalog data for a page, mapping provider "not found" to the 404 page. Other errors reach error.tsx. */
export async function loadOr404<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (isNotFound(error)) notFound();
    throw error;
  }
}

/** For optional page sections: failure yields the fallback instead of failing the page. */
export async function optional<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}
