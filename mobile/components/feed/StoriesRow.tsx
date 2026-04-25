import { ScrollView } from 'react-native';
import StoryItem from './StoryItem';
import { stories } from '../../features/feed/data';
import type { Story } from '../../features/feed/types';

interface StoriesRowProps {
  onStoryPress?: (story: Story) => void;
}

export default function StoriesRow({ onStoryPress }: StoriesRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingHorizontal: 20, paddingVertical: 12 }}
    >
      {stories.map((story) => (
        <StoryItem
          key={story.id}
          story={story}
          onPress={() => onStoryPress?.(story)}
        />
      ))}
    </ScrollView>
  );
}
