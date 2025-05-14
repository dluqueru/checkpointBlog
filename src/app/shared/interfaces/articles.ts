export interface Article{
    id: number,
    title: string,
    body: string,
    reported: boolean,
    state: string,
    publishDate: string,
    views: number,
    username: string,
    categories: [
        {
            categoryId: number, 
            categoryName: string
        }
    ]
}

export interface Image {
    id: number;
    imageUrl: string;
    publicId: string;
    format?: string;
    articleId: number;
}

export interface ArticlesResponse {
    hasNext: boolean;
    currentPage: number;
    articles: Article[];
}