import soundsData from './sounds.json';
import categoriesData from './categories.json';

export type Gradient = readonly [string, string];

export interface SoundCategory {
  id: string;
  label: string;
  gradient: Gradient;
  /** Applies to every sound in the category unless the sound overrides it. */
  defaultImage?: string;
}

export interface LibrarySound {
  id: string;
  name: string;
  artist: string;
  url: string;
  category: string;
  /** Overrides the category default for this one sound. */
  imageSrc?: string;
}

export interface ResolvedSound extends LibrarySound {
  categoryLabel: string;
  gradient: Gradient;
  /** imageSrc -> category defaultImage -> undefined, in which case draw the gradient. */
  image?: string;
}

export interface CategorySection {
  category: SoundCategory;
  sounds: ResolvedSound[];
}

const FALLBACK_GRADIENT: Gradient = ['#064e3b', '#155e75'];

// JSON widens the gradient pair to string[], so narrow it back to a tuple here
// and fall back if a category is ever authored with the wrong shape.
interface RawCategory {
  id: string;
  label: string;
  gradient?: string[];
  defaultImage?: string;
}

export const categories: SoundCategory[] = (categoriesData as RawCategory[]).map(c => ({
  id: c.id,
  label: c.label,
  defaultImage: c.defaultImage,
  gradient: c.gradient?.length === 2 ? ([c.gradient[0], c.gradient[1]] as Gradient) : FALLBACK_GRADIENT,
}));

const byId = new Map(categories.map(c => [c.id, c]));

const resolve = (sound: LibrarySound): ResolvedSound => {
  const category = byId.get(sound.category);
  return {
    ...sound,
    categoryLabel: category?.label ?? sound.category,
    gradient: category?.gradient ?? FALLBACK_GRADIENT,
    image: sound.imageSrc ?? category?.defaultImage,
  };
};

export const sounds: ResolvedSound[] = (soundsData as LibrarySound[]).map(resolve);

/**
 * Sounds grouped for display, in the order categories.json declares. Any sound
 * whose category is missing from that file is appended under its own heading so
 * it stays reachable rather than silently disappearing.
 */
export const sections: CategorySection[] = (() => {
  const grouped = categories.map(category => ({
    category,
    sounds: sounds.filter(s => s.category === category.id),
  }));

  const orphanIds = [...new Set(sounds.filter(s => !byId.has(s.category)).map(s => s.category))];
  const orphans = orphanIds.map(id => ({
    category: { id, label: id, gradient: FALLBACK_GRADIENT } as SoundCategory,
    sounds: sounds.filter(s => s.category === id),
  }));

  return [...grouped, ...orphans].filter(section => section.sounds.length > 0);
})();

export const gradientStyle = (gradient: Gradient) => ({
  backgroundImage: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
});
