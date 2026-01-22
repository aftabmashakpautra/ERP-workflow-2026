<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index()
    {
        $activities = \App\Models\ActivityLog::with('user')->latest()->get();

        return \Inertia\Inertia::render('activity-logs/index', [
            'activities' => $activities,
        ]);
    }
}
