#!/bin/bash 
sum=0
for file in Introduction.md Analysis.md Design.md Requirements-Specification.md Implementation.md Validation.md Discussion.md 
do
    count=$(pandoc -t plain $file | tr -d - | wc -m)
    sum=$(($sum + $count))
    echo "$file : $count"
done
echo "Total: $sum"

# sudo apt install pandoc
# ./wordcount.sh
