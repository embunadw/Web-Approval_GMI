<?php

namespace App\Http\Controllers;

use App\Models\MasterItem;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\MasterItemsImport;

class MasterItemController extends Controller
{
    public function index()
    {
        $items = MasterItem::orderBy('item_name')->get();

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    public function show($id)
    {
        $item = MasterItem::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $item,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'item_code' => 'required|unique:master_items',
            'item_name' => 'required',
            'category' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $item = MasterItem::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Item created successfully',
            'data' => $item,
        ], 201);
    }

    public function importExcel(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv',
        ]);

        try {
            Excel::import(new MasterItemsImport, $request->file('file'));

            return response()->json([
                'success' => true,
                'message' => 'Data imported successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}