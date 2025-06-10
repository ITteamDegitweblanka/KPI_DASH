import { useEffect, useState } from 'react';
import { apiService } from '../services/api';

const TestConnection = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  interface ApiResponse<T> {
    data: T;
    status: number;
    statusText: string;
    headers: any;
    config: any;
  }

  interface TestResponse {
    success: boolean;
    message: string;
    timestamp: string;
    environment: string;
  }

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await apiService.get<TestResponse>('/auth/test') as unknown as ApiResponse<TestResponse>;
        setData(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to connect to the server');
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  if (loading) return <div>Testing connection to backend...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ margin: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h2>Backend Connection Test</h2>
      <p>Status: <span style={{ color: 'green' }}>Connected successfully!</span></p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default TestConnection;
