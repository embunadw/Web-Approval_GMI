<?php
// app/Imports/MasterItemsImport.php

namespace App\Imports;

use App\Models\MasterItem;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class MasterItemsImport implements ToModel, WithHeadingRow, WithValidation
{
    public function model(array $row)
    {
        return new MasterItem([
            'item_code' => $row['item_code'],
            'item_name' => $row['item_name'],
            'category' => $row['category'] ?? null,
            'description' => $row['description'] ?? null,
        ]);
    }

    public function rules(): array
    {
        return [
            'item_code' => 'required|unique:master_items,item_code',
            'item_name' => 'required',
        ];
    }
}

// Format Excel yang diharapkan:
// | item_code | item_name        | category    | description              |
// |-----------|------------------|-------------|--------------------------|
// | ITM001    | Laptop Dell      | Electronics | Dell Laptop Core i5      |
// | ITM002    | Mouse Wireless   | Electronics | Logitech Wireless Mouse  |