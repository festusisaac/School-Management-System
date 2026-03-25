@extends('layouts.public')

@section('content')
<div style="background-color: var(--background); min-height: calc(100vh - 300px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem;">
    <div style="text-align: center; margin-bottom: 3rem;">
        <h1 style="font-size: 2.5rem; font-weight: 700; color: var(--secondary); margin-bottom: 1rem;">Check Student Result</h1>
        <p style="color: var(--text-light); max-width: 600px;">Enter your details and scratch card information below to access your academic report.</p>
    </div>

    <div style="background: white; padding: 3rem; border-radius: 1.5rem; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); max-width: 500px; width: 100%;">
        <form action="{{ route('result.check.submit') }}" method="POST">
            @csrf

            @if ($errors->any())
                <div style="background-color: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 1rem; border-radius: 0.5rem; margin-bottom: 2rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        There were errors with your submission
                    </div>
                    <ul style="list-style: disc; padding-left: 1.5rem; font-size: 0.875rem;">
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <div style="margin-bottom: 1.5rem;">
                <label for="adm_no" style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--text);">Admission Number</label>
                <input id="adm_no" name="adm_no" type="text" required value="{{ old('adm_no') }}"
                    style="width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; outline: none; transition: border-color 0.2s;"
                    placeholder="e.g. HIS/2023/001">
            </div>

            <div style="margin-bottom: 1.5rem;">
                <label for="session_id" style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--text);">Academic Session</label>
                <select id="session_id" name="session_id" required
                    style="width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; outline: none; background-color: white;">
                    @foreach($sessions as $session)
                        <option value="{{ $session->id }}" {{ old('session_id') == $session->id ? 'selected' : '' }}>
                            {{ $session->name }}
                        </option>
                    @endforeach
                </select>
            </div>

            <div style="margin-bottom: 2rem;">
                <label for="term_id" style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--text);">Term</label>
                <select id="term_id" name="term_id" required
                    style="width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; outline: none; background-color: white;">
                    @foreach($terms as $term)
                        <option value="{{ $term->id }}" {{ old('term_id') == $term->id ? 'selected' : '' }}>
                            {{ $term->term_name }}
                        </option>
                    @endforeach
                </select>
            </div>

            <div style="border-top: 1px solid #f1f5f9; padding-top: 2rem; margin-top: 2rem;">
                <h3 style="font-size: 1.1rem; font-weight: 600; color: var(--secondary); margin-bottom: 1.5rem;">Scratch Card Details</h3>
                
                <div style="margin-bottom: 1.5rem;">
                    <label for="serial" style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--text);">Serial Number</label>
                    <input id="serial" name="serial" type="text" required value="{{ old('serial') }}"
                        style="width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; outline: none;"
                        placeholder="Enter Card Serial Number">
                </div>

                <div style="margin-bottom: 2rem;">
                    <label for="pin" style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--text);">PIN</label>
                    <input id="pin" name="pin" type="text" required value="{{ old('pin') }}"
                        style="width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; outline: none;"
                        placeholder="Enter Card PIN">
                </div>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; display: flex; align-items: center; gap: 0.5rem;">
                Check Result
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
        </form>
    </div>
</div>
@endsection
