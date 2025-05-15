import { useEffect, useState } from 'react';
import { supabase } from '@/../utils/supabaseClient'
const SupabaseTest = () => {
    const [message, setMessage] = useState('Testing connection...');
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const testConnection = async () => {
            try {
                const { data, error } = await supabase.from('users').select('*').limit(1);
                if (error) {
                    console.error('Error:', error.message);
                    setMessage('❌ Supabase connection failed');
                } else {
                    setData(data);
                    setMessage('✅ Supabase connection successful');
                }
            } catch (err) {
                console.error('Unexpected error:', err);
                setMessage('❌ Unexpected error');
            }
        };

        testConnection();
    }, []);

    return (
        <div style={{ padding: '1rem' }}>
            <h2>{message}</h2>
            {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
        </div>
    );
};

export default SupabaseTest;