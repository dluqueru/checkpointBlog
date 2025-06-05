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

export interface ArticlePost {
    title: string;
    body: string;
    reported: boolean;
    state: 'DRAFT' | 'DEFINITIVE';
    publishDate: string | null;
    views: number;
    user: {
        username: string;
    };
    articleCategories: Array<{
        category: {
            id: number;
        }
    }>;
}

export interface Category {
    categoryId: number;
    categoryName: string;
}

export interface ArticlePut {
    id: number;
    title: string;
    body: string;
    reported: boolean;
    state: 'DRAFT' | 'DEFINITIVE';
    publishDate: string | null;
    views: number;
    username: string;
    categories: Category[];
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