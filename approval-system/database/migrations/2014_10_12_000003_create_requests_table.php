<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('item_id')->nullable()->constrained('master_items')->onDelete('set null');
            $table->integer('quantity')->default(1);
            
            // Status keseluruhan
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            
            // Leader approval (Level 1)
            $table->enum('leader_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('leader_approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('leader_approved_at')->nullable();
            $table->text('leader_rejection_reason')->nullable();
            
            // SPV approval (Level 2)
            $table->enum('SPV_status', ['pending', 'approved', 'rejected'])->nullable();
            $table->foreignId('SPV_approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('SPV_approved_at')->nullable();
            $table->text('SPV_rejection_reason')->nullable();
            
            // Manager approval (Level 3)
            $table->enum('manager_status', ['pending', 'approved', 'rejected'])->nullable();
            $table->foreignId('manager_approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('manager_approved_at')->nullable();
            $table->text('manager_rejection_reason')->nullable();
            
            // Kolom lama (bisa dihapus nanti kalau tidak dipakai)
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('requests');
    }
};