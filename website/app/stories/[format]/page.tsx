import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StoryChrome from "../story-chrome";
import StoryPage from "../story-page";
import { storyContent, type StoryFormat } from "../story-content";

type PageProps = { params: Promise<{ format: string }> };

function getStory(format: string) {
  return storyContent[format as StoryFormat];
}

export function generateStaticParams() {
  return Object.keys(storyContent).map((format) => ({ format }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { format } = await params;
  const story = getStory(format);
  if (!story) return { title: "Story format | Vertical Moment", robots: { index: false, follow: true } };
  return {
    title: story.titleLead + story.titleAccent + " | Vertical Moment",
    description: story.dek,
    robots: { index: false, follow: true, noarchive: true },
  };
}

export default async function StoryFormatPage({ params }: PageProps) {
  const { format } = await params;
  const story = getStory(format);
  if (!story) notFound();

  return (
    <StoryChrome current={story.format} backdropSrc={story.coverImage}>
      <StoryPage story={story} />
    </StoryChrome>
  );
}

