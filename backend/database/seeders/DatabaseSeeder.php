<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);

        \App\Models\Customer::updateOrCreate(
            ['email' => 'quocbao2010@gmail.com'],
            [
                'customer_code' => 'KH1776183244',
                'full_name' => 'Lâm Quốc Bảo',
                'password' => \Illuminate\Support\Facades\Hash::make('123456'),
                'phone' => '0397789902',
                'address' => '20, đường nguyễn khoái, phường vĩnh hội, quận 4, tphcm',
                'status' => 1,
            ]
        );
    }
}
