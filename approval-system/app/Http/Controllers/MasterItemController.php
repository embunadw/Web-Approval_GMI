<?php

namespace App\Http\Controllers;

use App\Models\MasterItem;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\MasterItemsImport;
use Illuminate\Support\Facades\Log;

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
            'file' => 'required|mimes:xlsx,xls,csv|max:2048', // Max 2MB
        ]);

        try {
            $file = $request->file('file');
            $import = new MasterItemsImport;
            
            // Baca data untuk validasi awal
            $data = Excel::toArray($import, $file);
            
            // Validasi 1: File kosong
            if (empty($data) || empty($data[0])) {
                return response()->json([
                    'success' => false,
                    'message' => 'File kosong atau tidak dapat dibaca',
                    'error_type' => 'empty_file',
                ], 422);
            }
            
            // Validasi 2: Cek header kolom
            $firstRow = $data[0][0];
            $expectedHeaders = ['item_code', 'item_name', 'category', 'description'];
            $fileHeaders = array_map('strtolower', array_map('trim', array_keys($firstRow)));
            
            // Cek kolom wajib
            $requiredHeaders = ['item_code', 'item_name'];
            $missingRequired = array_diff($requiredHeaders, $fileHeaders);
            
            if (!empty($missingRequired)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Struktur file tidak valid. Kolom wajib yang hilang: ' . implode(', ', $missingRequired),
                    'error_type' => 'invalid_structure',
                    'expected_headers' => $expectedHeaders,
                    'found_headers' => $fileHeaders,
                    'missing_headers' => $missingRequired,
                ], 422);
            }
            
            // Validasi 3: Jumlah baris data
            $totalRows = count($data[0]);
            
            if ($totalRows === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'File tidak memiliki data untuk diimpor (hanya header)',
                    'error_type' => 'no_data',
                ], 422);
            }
            
            if ($totalRows > 1000) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jumlah data melebihi batas maksimal. Maksimal 1000 baris, file Anda memiliki ' . $totalRows . ' baris',
                    'error_type' => 'too_many_rows',
                    'total_rows' => $totalRows,
                    'max_rows' => 1000,
                ], 422);
            }
            
            // Validasi 4: Cek data kosong atau tidak valid pada baris-baris awal
            $emptyRows = [];
            $previewLimit = min(5, $totalRows);
            
            for ($i = 0; $i < $previewLimit; $i++) {
                $row = $data[0][$i];
                if (empty(trim($row['item_code'] ?? '')) || empty(trim($row['item_name'] ?? ''))) {
                    $emptyRows[] = $i + 2; // +2 karena row 1 adalah header, array index mulai dari 0
                }
            }
            
            if (!empty($emptyRows)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Terdapat baris dengan data item_code atau item_name kosong pada baris: ' . implode(', ', $emptyRows),
                    'error_type' => 'empty_required_fields',
                    'empty_rows' => $emptyRows,
                ], 422);
            }
            
            // Proses import dengan validasi penuh
            Excel::import($import, $file);
            
            // Cek hasil validasi
            $failures = $import->failures();
            
            if ($failures->isNotEmpty()) {
                $errors = [];
                $errorSummary = [
                    'duplicate' => 0,
                    'required' => 0,
                    'invalid' => 0,
                ];
                
                foreach ($failures as $failure) {
                    $errorMessages = $failure->errors();
                    $errorType = 'invalid';
                    
                    // Kategorikan jenis error
                    foreach ($errorMessages as $message) {
                        if (stripos($message, 'sudah terdaftar') !== false || stripos($message, 'unique') !== false) {
                            $errorType = 'duplicate';
                            $errorSummary['duplicate']++;
                        } elseif (stripos($message, 'wajib diisi') !== false || stripos($message, 'required') !== false) {
                            $errorType = 'required';
                            $errorSummary['required']++;
                        } else {
                            $errorSummary['invalid']++;
                        }
                    }
                    
                    $errors[] = [
                        'row' => $failure->row(),
                        'column' => $failure->attribute(),
                        'error_type' => $errorType,
                        'messages' => $errorMessages,
                        'values' => $failure->values(),
                    ];
                }
                
                $successCount = $totalRows - count($errors);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Import selesai dengan error. ' . $successCount . ' baris berhasil, ' . count($errors) . ' baris gagal',
                    'error_type' => 'validation_failed',
                    'summary' => [
                        'total_rows' => $totalRows,
                        'success_rows' => $successCount,
                        'failed_rows' => count($errors),
                        'error_types' => $errorSummary,
                    ],
                    'errors' => array_slice($errors, 0, 50), // Batasi 50 error pertama untuk ditampilkan
                    'total_errors' => count($errors),
                ], 422);
            }
            
            // Sukses import semua data
            return response()->json([
                'success' => true,
                'message' => 'Data berhasil diimpor! Total ' . $totalRows . ' item berhasil ditambahkan',
                'summary' => [
                    'total_imported' => $totalRows,
                    'file_name' => $file->getClientOriginalName(),
                    'imported_at' => now()->format('Y-m-d H:i:s'),
                ],
            ]);
            
        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            $failures = $e->failures();
            $errors = [];
            
            foreach ($failures as $failure) {
                $errors[] = [
                    'row' => $failure->row(),
                    'column' => $failure->attribute(),
                    'messages' => $failure->errors(),
                    'values' => $failure->values(),
                ];
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Validasi data gagal pada ' . count($errors) . ' baris',
                'error_type' => 'validation_exception',
                'errors' => array_slice($errors, 0, 50),
                'total_errors' => count($errors),
            ], 422);
            
        } catch (\Illuminate\Database\QueryException $e) {
            Log::error('Import Database Error', [
                'file' => $request->file('file')->getClientOriginalName(),
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            
            // Error duplicate entry
            if ($e->getCode() == 23000) {
                return response()->json([
                    'success' => false,
                    'message' => 'Import gagal: Terdapat item_code yang sudah terdaftar di database',
                    'error_type' => 'duplicate_entry',
                    'suggestion' => 'Pastikan semua item_code unik dan belum ada di database',
                ], 422);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Import gagal: Terjadi kesalahan pada database',
                'error_type' => 'database_error',
            ], 500);
            
        } catch (\Exception $e) {
            Log::error('Import Excel Error', [
                'file' => $request->file('file')->getClientOriginalName(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Import gagal: ' . $e->getMessage(),
                'error_type' => 'system_error',
            ], 500);
        }
    }
}