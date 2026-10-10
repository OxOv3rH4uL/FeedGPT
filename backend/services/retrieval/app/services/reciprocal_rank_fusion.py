class ReciprocalRankFusion:
    def rrf(self,semantic,keyword,k:int=60,top:int=30):
        scores: dict = {}
        points:dict = {}
        # for rank,(index,_) in enumerate(semantic,start=1):
        #     scores[index] = scores.get(index,0.0) + 1.0/ (k+rank+1)
        # for rank,(index,_) in enumerate(keyword,start=1):
        #     scores[index] = scores.get(index,0.0) + 1.0 / (k+rank+1)
        for res in (semantic,keyword):
            for rank,p in enumerate(res):
                scores[p.id] = scores.get(p.id,0.0) + 1.0 / (k+rank+1)
                points.setdefault(p.id,p)

        ranked = sorted(scores, key=scores.get, reverse=True)[:top]
        return [points[i] for i in ranked]
