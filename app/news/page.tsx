import ComingSoon from "../components/ComingSoon";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { NewsPost } from "@/lib/supabase/types";

export const revalidate = 60;

async function getPosts(): Promise<NewsPost[]> {
  if (!supabaseConfigured) return [];
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("news_posts")
    .select("*")
    .eq("published", true)
    .order("post_date", { ascending: false });
  return data ?? [];
}

export default async function NewsPage() {
  const posts = await getPosts();

  if (posts.length === 0) {
    return (
      <ComingSoon
        eyebrow="Clan updates"
        title="News & Announcements"
        desc="This feed isn't live yet. Roster moves, scrim results, and clan-wide updates will show up here once we start posting."
      />
    );
  }

  return (
    <>
      <div className="mx-auto max-w-5xl px-5 pb-5 pt-14 md:px-8 md:pt-[60px]">
        <div className="mb-2.5 flex flex-wrap items-center gap-4">
          <div className="eyebrow">Clan updates</div>
          <span className="live-dot">Live feed</span>
        </div>
        <h1 className="font-display text-[28px] font-bold uppercase tracking-tight text-text md:text-[38px]">
          News &amp; Announcements
        </h1>
        <p className="mt-3 max-w-lg text-[13.5px] text-text-dim">
          Roster moves, scrim results, and clan-wide updates — everything GenXio members need
          to stay in the loop.
        </p>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-6 md:px-8">
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <div key={post.id} className="card flex flex-col gap-2 sm:flex-row sm:gap-5">
              <div className="font-display min-w-[78px] shrink-0 text-xs font-bold tracking-[0.08em] text-purple">
                {new Date(post.post_date + "T00:00:00").toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div>
                <span className="tag-chip mb-2.5">{post.tag}</span>
                <h3 className="mb-2 text-base font-semibold text-text">{post.title}</h3>
                <p className="text-[13px] leading-[1.7] text-text-dim">{post.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
