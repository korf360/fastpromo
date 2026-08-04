import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSiteUrl();
  const lastModified = new Date();

  const paths: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"] }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/packages", priority: 0.95, changeFrequency: "daily" },
    { path: "/faq", priority: 0.8, changeFrequency: "monthly" },
    { path: "/status", priority: 0.7, changeFrequency: "daily" },
    { path: "/legal", priority: 0.5, changeFrequency: "monthly" },
    { path: "/terms", priority: 0.5, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.5, changeFrequency: "monthly" },
    { path: "/cookies", priority: 0.5, changeFrequency: "monthly" },
    { path: "/login", priority: 0.4, changeFrequency: "yearly" },
    { path: "/register", priority: 0.4, changeFrequency: "yearly" },
  ];

  return paths.map(({ path, priority, changeFrequency }) => ({
    url: `${site}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
