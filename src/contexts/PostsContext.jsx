import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const PostsContext = createContext();

export function PostsProvider({ children }) {
  const [posts, setPosts] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const companyId = JSON.parse(localStorage.getItem('user') || 'null')?.companyId;
      const url = `/api/get-posts${companyId ? `?companyId=${companyId}` : ''}`;
      const response = await axios.get(url);
      const all = Array.isArray(response.data?.[0]?.data) ? response.data[0].data : [];
      setPosts(all.filter(p => !p["Slide No."]));
      setSegments(all.filter(p => p["Slide No."]));
    } catch (err) {
      setError('Virhe haettaessa julkaisuja');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <PostsContext.Provider value={{ posts, segments, loading, error, refetch: fetchPosts }}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  return useContext(PostsContext);
} 