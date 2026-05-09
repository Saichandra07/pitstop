import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useActiveJob } from '../context/ActiveJobContext';
import api from '../api/axios';

const TAGS = [
  'Arrived fast', 'Fixed it right', 'Professional',
  'Fair price', 'Friendly',
  'Arrived late', 'Rude', "Didn't fix properly",
];

export default function RatingPrompt() {
  const { user } = useAuth();
  const { justCompletedJobId, setJustCompletedJobId } = useActiveJob();

  const [rating, setRating]       = useState(0);
  const [hovered, setHovered]     = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');

  if (!justCompletedJobId || user?.role !== 'USER') return null;

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/jobs/${justCompletedJobId}/review`, {
        rating,
        comment: comment.trim() || null,
        tags: selectedTags,
      });
      setJustCompletedJobId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit review. Try again.');
      setSubmitting(false);
    }
  };

  const handleSkip = () => setJustCompletedJobId(null);

  const displayRating = hovered || rating;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 110,
      background: 'rgba(10,10,15,0.95)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 16px',
    }}>
      <div style={{
        width: '100%', maxWidth: 360,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '24px 20px',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Rate your mechanic</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>How did it go?</div>
        </div>

        {/* Stars */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 32, padding: 4, lineHeight: 1,
                color: star <= displayRating ? 'var(--gold)' : 'var(--surface3)',
                filter: star <= displayRating ? 'none' : 'brightness(0.4)',
                transition: 'color 0.1s, filter 0.1s',
              }}
            >
              ★
            </button>
          ))}
        </div>

        {/* Quick tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {TAGS.map(tag => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  fontSize: 11, fontWeight: 600, padding: '5px 10px',
                  borderRadius: 9999, cursor: 'pointer',
                  background: active ? 'rgba(230,57,70,0.12)' : 'var(--surface3)',
                  border: `1px solid ${active ? 'rgba(230,57,70,0.4)' : 'var(--border)'}`,
                  color: active ? 'var(--red)' : 'var(--text-2)',
                  transition: 'all 0.15s',
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Any comments? (optional)"
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '10px 12px',
            color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font)',
            resize: 'none', outline: 'none', marginBottom: 16,
          }}
        />

        {/* Error */}
        {error && (
          <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className="ps-btn"
          style={{ marginBottom: 10, opacity: rating === 0 ? 0.45 : 1 }}
        >
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>
        <button onClick={handleSkip} className="ps-btn-ghost">
          Skip
        </button>
      </div>
    </div>
  );
}
