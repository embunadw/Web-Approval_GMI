<?php

namespace App\Imports;

use App\Models\MasterItem;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Validators\Failure;

class MasterItemsImport implements ToModel, WithHeadingRow, WithValidation, SkipsOnFailure
{
    use Importable;
    
    private $failures = [];

    /**
     * Mapping data dari Excel ke Model
     */
    public function model(array $row)
    {
        // Skip baris yang kosong
        if (empty(trim($row['item_code'] ?? '')) && empty(trim($row['item_name'] ?? ''))) {
            return null;
        }

        return new MasterItem([
            'item_code' => trim($row['item_code']),
            'item_name' => trim($row['item_name']),
            'category' => isset($row['category']) ? trim($row['category']) : null,
            'description' => isset($row['description']) ? trim($row['description']) : null,
        ]);
    }
    
    /**
     * Aturan validasi untuk setiap baris
     */
    public function rules(): array
    {
        return [
            'item_code' => [
                'required',
                'string',
                'max:50',
                'unique:master_items,item_code',
                'regex:/^[A-Za-z0-9\-_]+$/', // Hanya huruf, angka, dash, underscore
            ],
            'item_name' => [
                'required',
                'string',
                'max:255',
                'min:3',
            ],
            'category' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:1000',
        ];
    }
    

    public function customValidationMessages()
    {
        return [
            // Item Code
            'item_code.required' => 'Kode item wajib diisi',
            'item_code.unique' => 'Kode item sudah terdaftar di database',
            'item_code.max' => 'Kode item maksimal 50 karakter',
            'item_code.regex' => 'Kode item hanya boleh berisi huruf, angka, dash (-), dan underscore (_)',
            
            // Item Name
            'item_name.required' => 'Nama item wajib diisi',
            'item_name.min' => 'Nama item minimal 3 karakter',
            'item_name.max' => 'Nama item maksimal 255 karakter',
            
            // Category
            'category.max' => 'Kategori maksimal 100 karakter',
            
            // Description
            'description.max' => 'Deskripsi maksimal 1000 karakter',
        ];
    }
    

    public function onFailure(Failure ...$failures)
    {
        $this->failures = array_merge($this->failures, $failures);
    }
    
 
    public function failures()
    {
        return collect($this->failures);
    }
}