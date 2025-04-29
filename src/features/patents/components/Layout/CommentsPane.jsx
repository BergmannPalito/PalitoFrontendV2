// src/features/patents/components/Layout/CommentsPane.jsx
import CommentCard from './CommentCard';
import { useComments } from '@/features/patents/hooks/useComments';

export default function CommentsPane() {
  const { comments, isLoading, error } = useComments();

  if (isLoading) { /* ... loading ... */ }
  if (error) { /* ... error ... */ }

  return (
    <section className="h-full basis-1/4 flex flex-col overflow-hidden border-l border-gray-200 bg-gray-100 transition-all duration-300 ease-in-out">
      {/* Header */}
      {/* --- Use Fixed Height and Flex Alignment --- */}
      <div className={
          "sticky top-0 z-10 border-b border-gray-200 bg-gray-50 " +
          "px-4 lg:px-5 " + // Horizontal padding
          "h-11 " + // Apply fixed height (adjust value if needed: h-10, h-12 etc.)
          "flex items-center " + // Vertically center content
          "shadow-sm shrink-0"
      }>
        {/* Text size and weight can remain */}
        <h3 className="text-base font-semibold leading-none text-gray-900"> {/* Use leading-none if needed */}
           Comments ({comments?.length || 0})
        </h3>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4 lg:p-5">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentCard
                key={comment.id}
                comment={comment}
                level={0}
            />
          ))
        ) : (
          <p className="text-center text-sm text-gray-500 pt-4">No comments yet.</p>
        )}
         <div className="h-4"></div>
      </div>
    </section>
  );
}