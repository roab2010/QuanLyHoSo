<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProjectController;

use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Các route cho Category
Route::apiResource('categories', CategoryController::class);

// Xử lý riêng cho Project (Viết Route PUT đè lên trước Resource)
Route::put('projects/{id}', [ProjectController::class, 'update']); 
Route::apiResource('projects', ProjectController::class);

//route xử lí customer
Route::get('/customers', [ProjectController::class, 'getCustomers']);

// Route để cào tin tức từ VnExpress
Route::get('/news', function () {
    $client = new Client(['verify' => false, 'timeout' => 10]);
    
    // Danh sách các chuyên mục bạn muốn cào
    $categories = [
        'Thời sự' => 'https://vnexpress.net/thoi-su',
        'Thế giới'  => 'https://vnexpress.net/the-gioi',
        'Kinh doanh' => 'https://vnexpress.net/kinh-doanh',
        'Thể thao'  => 'https://vnexpress.net/the-thao',
        'Giải trí'  => 'https://vnexpress.net/giai-tri'
    ];

    $allNews = [];

    foreach ($categories as $name => $url) {
        try {
            $response = $client->request('GET', $url);
            $html = $response->getBody()->getContents();
            $crawler = new Crawler($html);

            // Lấy tối đa 5-7 tin mỗi chuyên mục để tránh danh sách quá dài
            $crawler->filter('article.item-news')->slice(0, 6)->each(function (Crawler $node) use (&$allNews, $name) {
                $titleNode = $node->filter('h3.title-news > a');
                $title = $titleNode->count() > 0 ? $titleNode->text() : null;
                $link = $titleNode->count() > 0 ? $titleNode->attr('href') : null;

                $imgNode = $node->filter('div.thumb-art img');
                $image = null;
                if ($imgNode->count() > 0) {
                    $image = $imgNode->attr('data-src') ?? $imgNode->attr('src');
                }

                if ($title && $link) {
                    $allNews[] = [
                        'title'    => $title,
                        'link'     => $link,
                        'image'    => $image ?? 'https://via.placeholder.com/400x250',
                        'category' => $name // Lưu thêm tên chuyên mục để React hiển thị tag
                    ];
                }
            });
        } catch (\Exception $e) {
            // Nếu một chuyên mục lỗi thì bỏ qua, cào tiếp cái khác
            continue;
        }
    }

    // Trộn ngẫu nhiên tin tức để nhìn cho đa dạng (tùy chọn)
    // shuffle($allNews);

    return response()->json($allNews);
});