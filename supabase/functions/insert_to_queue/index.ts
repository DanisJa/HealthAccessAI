// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabaseUrl = 'https://hkmeashdtfncnsxqhgob.supabase.co';
const supabaseKey =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrbWVhc2hkdGZuY25zeHFoZ29iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzE1MDQzOSwiZXhwIjoyMDYyNzI2NDM5fQ.JxzGUU85fwASHTl2BOxYvZm7D_o_YTrtaj0mBQyCNiQ';

const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
	const data = await req.json();

	if (
		!data.jmbg ||
		!data.doctorId ||
		!data.hospitalId ||
		!data.firstName ||
		!data.lastName
	) {
		return new Response(JSON.stringify('Something is missing, ask Danis.'));
	}

	if (!data.jmbg) {
		return new Response(JSON.stringify({ message: 'need patient jmbg' }));
	}

	const newObject = {
		doctor_id: data.doctorId,
		hospital_id: data.hospitalId,
		jmbg: data.jmbg,
		first_name: data.firstName,
		last_name: data.lastName,
	};

	const { data: patientId, error: patientIdError } = await supabase
		.from('users')
		.select('id')
		.eq('jmbg', data.jmbg)
		.single();

	console.error(patientIdError);
	console.log('Patient id: ', patientId);

	if (patientId) {
		const { error } = await supabase.from('queue').insert({
			doctor_id: newObject.doctor_id,
			hospital_id: newObject.hospital_id,
			jmbg: newObject.jmbg,
			first_name: newObject.first_name,
			last_name: newObject.last_name,
			patient_id: patientId?.id,
		});

		if (error) {
			return new Response(
				JSON.stringify({ message: 'Could not add patient to queue' })
			);
		} else {
			return new Response(
				JSON.stringify({ message: 'Patient added to queue' })
			);
		}
	} else {
		const { error: queueInsertError } = await supabase.from('queue').insert({
			doctor_id: newObject.doctor_id,
			hospital_id: newObject.hospital_id,
			jmbg: newObject.jmbg,
			first_name: newObject.first_name,
			last_name: newObject.last_name,
		});

		if (queueInsertError) {
			return new Response(JSON.stringify({ message: queueInsertError }));
		}

		return new Response(
			JSON.stringify({
				message: 'Added new patient, not registered in the system',
			})
		);
	}
});
