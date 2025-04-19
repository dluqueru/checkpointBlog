export interface Article{
    id: number,
    title: string,
    body: string,
    reported: boolean,
    state: string,
    publishDate: string,
    username: string,
    categories: [
        {
            categoryId: number, 
            categoryName: string
        }
    ]
}