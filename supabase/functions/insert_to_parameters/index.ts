import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://hkmeashdtfncnsxqhgob.supabase.co';
const supabaseKey =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrbWVhc2hkdGZuY25zeHFoZ29iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzE1MDQzOSwiZXhwIjoyMDYyNzI2NDM5fQ.JxzGUU85fwASHTl2BOxYvZm7D_o_YTrtaj0mBQyCNiQ';

const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
	const { hospital_id, type, value, unit, notes, jmbg } = await req.json();

	if (!hospital_id || !type || !value || !unit || !notes || !jmbg) {
		return new Response(JSON.stringify({ message: 'Missing params' }));
	}

	const { data, error } = await supabase
		.from('users')
		.select('id')
		.eq('jmbg', jmbg)
		.maybeSingle();

	if (data?.id) {
		const { error: insertParamsError } = await supabase
			.from('parameters')
			.insert({
				hospital_id,
				type,
				value,
				unit,
				notes,
				patient_id: data.id,
				jmbg,
			});

		if (insertParamsError) {
			console.error(error);
			return new Response(JSON.stringify({ message: error }));
		}

		return new Response(JSON.stringify({ message: 'success' }));
	} else {
		const { error: insertParamsError } = await supabase
			.from('parameters')
			.insert({
				hospital_id,
				type,
				value,
				unit,
				notes,
				jmbg,
			});

		if (insertParamsError) {
			console.error(error);
			return new Response(JSON.stringify({ message: error }));
		}

		return new Response(JSON.stringify({ message: 'success' }));
	}
});
