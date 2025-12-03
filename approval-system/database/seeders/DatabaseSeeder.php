<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\MasterItem;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        // Nonaktifkan constraint FK agar tidak error saat delete
        Schema::disableForeignKeyConstraints();

        // Hapus data lama (gunakan delete, BUKAN truncate)
        User::query()->delete();
        MasterItem::query()->delete();

        // -------------------------
        // SEED USER (UPDATED - Multi Level Approval)
        // -------------------------
        
        // Role: User/Staff (yang membuat request)
        User::create([
            'name' => 'Staff User',
            'email' => 'staff@gmail.com',
            'password' => Hash::make('123'),
            'role' => 'user',
        ]);

        User::create([
            'name' => 'Staff2 User',
            'email' => 'staff2@gmail.com',
            'password' => Hash::make('123'),
            'role' => 'user',
        ]);

        // Role: Leader (Approval Level 1)
        User::create([
            'name' => 'Leader User',
            'email' => 'leader@gmail.com',
            'password' => Hash::make('123'),
            'role' => 'leader',
        ]);

        // Role: spv (Approval Level 2) 
        User::create([
            'name' => 'SPV User',
            'email' => 'spv@gmail.com',
            'password' => Hash::make('123'),
            'role' => 'spv',
        ]);

        // Role: Manager (Approval Level 3) 
        User::create([
            'name' => 'Manager User',
            'email' => 'manager@gmail.com',
            'password' => Hash::make('123'),
            'role' => 'manager',
        ]);

        // -------------------------
        // SEED MASTER ITEM
        // -------------------------
        $items = [
            [
                'item_code' => 'ITM001',
                'item_name' => 'Laptop Dell',
                'category' => 'Electronics',
                'description' => 'Dell Laptop Core i5',
            ],
            [
                'item_code' => 'ITM002',
                'item_name' => 'Mouse Wireless',
                'category' => 'Electronics',
                'description' => 'Logitech Wireless Mouse',
            ],
            [
                'item_code' => 'ITM003',
                'item_name' => 'Office Chair',
                'category' => 'Furniture',
                'description' => 'Ergonomic Office Chair',
            ],
            [
                'item_code' => 'ITM004',
                'item_name' => 'Whiteboard',
                'category' => 'Office Supplies',
                'description' => 'Large Whiteboard 120x80cm',
            ],
            [
                'item_code' => 'ITM005',
                'item_name' => 'Printer HP',
                'category' => 'Electronics',
                'description' => 'HP LaserJet Printer',
            ],
        ];

        foreach ($items as $item) {
            MasterItem::create($item);
        }

        // Aktifkan kembali constraint FK
        Schema::enableForeignKeyConstraints();

        echo "\n=================================\n";
        echo "Seeder berhasil dijalankan!\n";
        echo "=================================\n";
        echo "Login credentials:\n";
        echo "- Staff: staff@gmail.com / 123\n";
        echo "- Staff2: staff2@gmail.com / 123\n";
        echo "- Leader: leader@gmail.com / 123\n";
        echo "- spv: spv@gmail.com / 123\n";
        echo "- Manager: manager@gmail.com / 123\n";
        echo "=================================\n\n";
    }
}