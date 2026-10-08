class ReciprocalRankFusion:
    async def rrf(semantic,keyword,k:int=50,top:int=30):
        scores = {}
        for rank,(index,_) in enumerate(semantic):
            scores[index] = (scores.get(index,0) + 1)/ (k+rank+1)
        for rank,(index,_) in enumerate(keyword):
            scores[index] = (scores.get(index,0) + 1 )/ (k+rank+1)

        return sorted(scores.items(),key=lambda x : x[1], reverse=True)[:top]
