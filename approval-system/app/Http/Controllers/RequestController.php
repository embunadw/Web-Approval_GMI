<?php

namespace App\Http\Controllers;

use App\Models\Request as RequestModel;
use Illuminate\Http\Request;

class RequestController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = RequestModel::with([
            'user', 
            'item', 
            'leaderApprover', 
            'spvApprover', 
            'managerApprover'
        ]);

        // Filter berdasarkan role
        if ($user->isUser()) {
            // User hanya bisa lihat request miliknya sendiri
            $query->where('user_id', $user->id);
        } elseif ($user->isLeader()) {
            // Leader bisa lihat semua request yang pending approval di level-nya
            // atau yang sudah dia approve
            $query->where(function($q) use ($user) {
                $q->where('leader_status', 'pending')
                  ->orWhere('leader_approved_by', $user->id);
            });
        } elseif ($user->isSPV()) {
            // SPV bisa lihat request yang sudah di-approve leader
            $query->where(function($q) use ($user) {
                $q->where(function($subQ) {
                    $subQ->where('leader_status', 'approved')
                         ->where('spv_status', 'pending');
                })->orWhere('spv_approved_by', $user->id);
            });
        } elseif ($user->isManager()) {
            // Manager bisa lihat request yang sudah di-approve SPV
            $query->where(function($q) use ($user) {
                $q->where(function($subQ) {
                    $subQ->where('leader_status', 'approved')
                         ->where('spv_status', 'approved')
                         ->where('manager_status', 'pending');
                })->orWhere('manager_approved_by', $user->id);
            });
        }

        $requests = $query->orderBy('created_at', 'desc')->get();

        // Tambahkan info current approval level di setiap request
        $requests = $requests->map(function($req) {
            $req->current_approval_level = $req->getCurrentApprovalLevel();
            return $req;
        });

        return response()->json([
            'success' => true,
            'data' => $requests,
        ]);
    }

    public function show($id)
    {
        $request = RequestModel::with([
            'user', 
            'item', 
            'leaderApprover', 
            'spvApprover', 
            'managerApprover'
        ])->findOrFail($id);

        $request->current_approval_level = $request->getCurrentApprovalLevel();

        return response()->json([
            'success' => true,
            'data' => $request,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'item_id' => 'required|exists:master_items,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $newRequest = RequestModel::create([
            'user_id' => $request->user()->id,
            'title' => $request->title,
            'description' => $request->description,
            'item_id' => $request->item_id,
            'quantity' => $request->quantity,
            'status' => 'pending',
            'leader_status' => 'pending',
            'spv_status' => null,
            'manager_status' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Request created successfully',
            'data' => $newRequest->load(['user', 'item']),
        ], 201);
    }

    public function approve(Request $request, $id)
    {
        $user = $request->user();
        $requestModel = RequestModel::findOrFail($id);

        // Cek apakah request sudah fully approved atau rejected
        if ($requestModel->isFullyApproved()) {
            return response()->json([
                'success' => false,
                'message' => 'Request is already fully approved',
            ], 400);
        }

        if ($requestModel->isRejected()) {
            return response()->json([
                'success' => false,
                'message' => 'Request is already rejected',
            ], 400);
        }

        // Approval Logic berdasarkan role dan level
        if ($user->isLeader() && $requestModel->isPendingLeaderApproval()) {
            // Leader Approval (Level 1)
            $requestModel->update([
                'leader_status' => 'approved',
                'leader_approved_by' => $user->id,
                'leader_approved_at' => now(),
                'spv_status' => 'pending', // Set SPV ke pending
            ]);

            $message = 'Request approved by Leader. Waiting for SPV approval.';

        } elseif ($user->isSPV() && $requestModel->isPendingSPVApproval()) {
            // SPV Approval (Level 2)
            $requestModel->update([
                'spv_status' => 'approved',
                'spv_approved_by' => $user->id,
                'spv_approved_at' => now(),
                'manager_status' => 'pending', // Set Manager ke pending
            ]);

            $message = 'Request approved by spv. Waiting for Manager approval.';

        } elseif ($user->isManager() && $requestModel->isPendingManagerApproval()) {
            // Manager Approval (Level 3 - Final)
            $requestModel->update([
                'manager_status' => 'approved',
                'manager_approved_by' => $user->id,
                'manager_approved_at' => now(),
                'status' => 'approved', // Set status keseluruhan jadi approved
                'approved_by' => $user->id,
                'approved_at' => now(),
            ]);

            $message = 'Request fully approved by Manager.';

        } else {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to approve at this level or request is not at your approval level',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $requestModel->fresh([
                'user', 
                'item', 
                'leaderApprover', 
                'spvApprover', 
                'managerApprover'
            ]),
        ]);
    }

    public function reject(Request $request, $id)
    {
        $user = $request->user();

        $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        $requestModel = RequestModel::findOrFail($id);

        // Cek apakah request sudah fully approved atau rejected
        if ($requestModel->isFullyApproved()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot reject an already approved request',
            ], 400);
        }

        if ($requestModel->isRejected()) {
            return response()->json([
                'success' => false,
                'message' => 'Request is already rejected',
            ], 400);
        }

        // Rejection Logic berdasarkan role dan level
        if ($user->isLeader() && $requestModel->isPendingLeaderApproval()) {
            // Leader Rejection
            $requestModel->update([
                'leader_status' => 'rejected',
                'leader_approved_by' => $user->id,
                'leader_approved_at' => now(),
                'leader_rejection_reason' => $request->rejection_reason,
                'status' => 'rejected',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'rejection_reason' => $request->rejection_reason,
            ]);

            $message = 'Request rejected by Leader.';

        } elseif ($user->isSPV() && $requestModel->isPendingSPVApproval()) {
            // SPV Rejection
            $requestModel->update([
                'spv_status' => 'rejected',
                'spv_approved_by' => $user->id,
                'spv_approved_at' => now(),
                'spv_rejection_reason' => $request->rejection_reason,
                'status' => 'rejected',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'rejection_reason' => $request->rejection_reason,
            ]);

            $message = 'Request rejected by SPV.';

        } elseif ($user->isManager() && $requestModel->isPendingManagerApproval()) {
            // Manager Rejection
            $requestModel->update([
                'manager_status' => 'rejected',
                'manager_approved_by' => $user->id,
                'manager_approved_at' => now(),
                'manager_rejection_reason' => $request->rejection_reason,
                'status' => 'rejected',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'rejection_reason' => $request->rejection_reason,
            ]);

            $message = 'Request rejected by Manager.';

        } else {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to reject at this level or request is not at your approval level',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $requestModel->fresh([
                'user', 
                'item', 
                'leaderApprover', 
                'spvApprover', 
                'managerApprover'
            ]),
        ]);
    }
}