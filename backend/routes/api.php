<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProjectController;

use Illuminate\Support\Facades\Cache;
use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;
use App\Http\Controllers\TemplateTaskController;

use App\Http\Controllers\InventoryController;

use App\Http\Controllers\SupplierController;

Route::get('/inventory', [InventoryController::class, 'index']);
Route::post('/products', [InventoryController::class, 'store']);
Route::post('/inventory/transaction', [InventoryController::class, 'storeTransaction']);
Route::delete('/products/{id}', [InventoryController::class, 'destroy']);

Route::get('/suppliers/stats', [SupplierController::class, 'getStats']); // Cho các thẻ thống kê
Route::apiResource('suppliers', SupplierController::class);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Các route cho Category
Route::apiResource('categories', CategoryController::class);

// Lấy danh sách: GET http://localhost:8000/api/template-tasks/category/1
Route::get('/template-tasks/category/{categoryId}', [TemplateTaskController::class, 'index']);

// Thêm mới: POST http://localhost:8000/api/template-tasks
Route::post('/template-tasks', [TemplateTaskController::class, 'store']);

// Cập nhật: PUT http://localhost:8000/api/template-tasks/1
Route::put('/template-tasks/{id}', [TemplateTaskController::class, 'update']);

// Xóa: DELETE http://localhost:8000/api/template-tasks/1
Route::delete('/template-tasks/{id}', [TemplateTaskController::class, 'destroy']);

// Xử lý riêng cho Project (Viết Route PUT đè lên trước Resource)
Route::put('projects/{id}', [ProjectController::class, 'update']);
Route::apiResource('projects', ProjectController::class);

//route xử lí customer
Route::get('/customers', [ProjectController::class, 'getCustomers']);

// Route cho nhân viên
Route::get('/employees', [ProjectController::class, 'getEmployees']);

// Route cho tasks (tiến độ thi công)
Route::post('/projects/{projectId}/tasks', [ProjectController::class, 'storeTask']);
Route::put('/projects/{projectId}/tasks/{taskId}', [ProjectController::class, 'updateTask']);
Route::delete('/projects/{projectId}/tasks/{taskId}', [ProjectController::class, 'destroyTask']);

// Route cho tài liệu
Route::put('/projects/{projectId}/documents/{docId}', [ProjectController::class, 'updateDocument']);

// Route cho thành viên
Route::post('/projects/{projectId}/members', [ProjectController::class, 'addMember']);
Route::delete('/projects/{projectId}/members/{memberId}', [ProjectController::class, 'removeMember']);

// Route để cào tin tức từ VnExpress
Route::get('/news', function () {

    return Cache::remember('news_cache', 300, function () {

        $client = new Client([
            'timeout' => 10,
            'headers' => [
                'User-Agent' => 'Mozilla/5.0'
            ]
        ]);

        $categories = [
            'Thời sự' => 'https://vnexpress.net/thoi-su',
            'Thế giới' => 'https://vnexpress.net/the-gioi',
            'Kinh doanh' => 'https://vnexpress.net/kinh-doanh',
            'Thể thao' => 'https://vnexpress.net/the-thao',
            'Giải trí' => 'https://vnexpress.net/giai-tri'
        ];

        $allNews = [];

        foreach ($categories as $name => $url) {
            try {
                $response = $client->request('GET', $url);
                $crawler = new Crawler($response->getBody()->getContents());

                $crawler->filter('article.item-news')->slice(0, 6)
                    ->each(function (Crawler $node) use (&$allNews, $name) {

                        $titleNode = $node->filter('h3.title-news > a');
                        if ($titleNode->count() === 0) return;

                        $imgNode = $node->filter('div.thumb-art img');

                        // ✅ Lấy ảnh chuẩn
                        $image = null;
                        if ($imgNode->count() > 0) {
                            $image = $imgNode->attr('data-src')
                                ?? $imgNode->attr('data-original')
                                ?? $imgNode->attr('src');
                        }

                        // ✅ Fix thiếu https
                        if ($image && str_starts_with($image, '//')) {
                            $image = 'https:' . $image;
                        }

                        // ✅ fallback
                        if (!$image) {
                            $image = 'https://via.placeholder.com/400x250';
                        }

                        $allNews[] = [
                            'title' => $titleNode->text(),
                            'link' => $titleNode->attr('href'),
                            'image' => $image,
                            'category' => $name
                        ];
                    });
            } catch (\Exception $e) {
                continue;
            }
        }

        return $allNews;
    });
});
