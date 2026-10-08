class ReciprocalRankFusion:
    async def rrf(self,semantic,keyword,k:int=50,top:int=30):
        scores = {}
        for rank,(index,_) in enumerate(semantic,start=1):
            scores[index] = scores.get(index,0.0) + 1.0/ (k+rank+1)
        for rank,(index,_) in enumerate(keyword,start=1):
            scores[index] = scores.get(index,0.0) + 1.0 / (k+rank+1)

        return sorted(scores.items(),key=lambda x : x[1], reverse=True)[:top]
