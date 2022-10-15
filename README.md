# Libra

一个称次品问题的求解模型

## 在线示例 

[简体中文](https://darrendanielday.github.io/Libra)

[English](https://darrendanielday.github.io/Libra?lang=en)

[饿了么CDN加速](https://darrendanielday.github.io/Libra?cdn=https%3A%2F%2Fgithub.elemecdn.com)

## 运行 Demo

环境需求：[`Node.JS 12+`](https://nodejs.org/)

```sh
npm install
npm run dev   # 开启tsc的watch模式，修改代码后无需重复运行
npm run demo  # 运行demo的代码
```

如果使用`vscode`打开此项目，可在安装好依赖后直接按`F5`进行demo的运行与调试。

## 问题

小学版本：

9 个药丸，其中一个是解药（比毒药轻），如何用无砝码天平称 2 次找到解药？

贴吧版本：

12 个产品，已知其中一个是次品，但不知道是比合格品更轻还是更重。如何用无砝码天平称 3 次找到次品，并得知次品是轻是重？

## 问题建模

### 前提

- 只有 1 个是次品（质量不同）
- 允许的操作只有使用无砝码天平，读取 1 次天平的平衡状态，视作称取操作 1 次
- 天平左右称取数量不等的平衡状态认为没有意义

### 数学化

有`n`个产品。

其中有且仅有 1 个是次品。

次品的质量比合格品的轻重情况有 2 种。

无砝码天平平衡状态有 3 种。

操作次数**上限**为`k`。

问题域：

将`N`个产品，编号记作`0 ~ N - 1`，记编号的集合为`Products = {p ∈ Z| 0 ≤ p ≤ n - 1}`。

次品的质量比合格品的可能轻重情况，用集合`Differences = {'lighter', 'heavier'}`表示。

无砝码天平平衡状态，用集合`WeighResult = { 'left', 'balance', 'right' }`表示。

则可能的称取操作可用集合`Strategy = { (Lefts, Rights) | Lefts, Rights ∈ Power(Products) 且 |Lefts| = |Rights| 且 lefts ∩ rights = Ø }`

> 注：此处用 Power(S)表示集合 S 的幂集，|S|表示集合 S 的大小

设对于具体的一种实际次品轻重与编号的情况，次品为`bad ∈ Products`，轻重情况为`d ∈ Differences`。则可用有序对`(bad, d)`来表示一种具体的次品的`enumerated`。

称取策略结论的值域为次品与轻重情况的笛卡尔积`Cases = Products × Differences`。

需求解：一颗树`tree`用于代表称取策略，满足：

1. 所有的非叶节点都包含一个`strategy ∈ Strategy`，对应如何称取。
2. 每个非叶节点的子节点**最多**`|WeighResult| = 3`个，对应给定天平平衡状态下采取的下一步应该移动至哪个节点。
3. 所有的叶子节点都包含一个`enumerated ∈ Cases`，代表得出的结论。
4. `tree`的称取策略深度不超过`k`，即任意非叶节点的深度 ≤`k`。
5. 对于任意的`enumerated ∈ Cases`，都是正确的树，即能通过下面定义的函数`TestTree(enumerated, tree)`的检测。

#### TestTree(enumerated, tree)

定义倾斜函数：`lean(d: Differences) -> WeighResult`

若`d`为`'lighter'`，则返回`'left'`。
否则，返回`'right'`。

---

定义反转函数：`inverse(w: WeighResult) -> WeighResult`

若`w`为`'left'`，则返回`'right'`。
若`w`为`'right'`，则返回`'left'`。
其他情况，返回`'balance'`。

---

定义称取函数：`weigh(enumerated: Cases, strategy: (Power(Products), Power(Products))) -> WeighResult`

设`enumerated = (bad, d)`，`strategy = (Lefts, Rights)`。
若`bad ∈ Lefts`，则返回`lean(d)`。
若`bad ∈ Rights`，则返回`inverse(lean(d))`。
其他情况返回`'balance'`。

---

定义验证`tree`正确性的函数`TestTree(enumerated: Cases, tree) -> boolean`

令当前节点`node`为`tree`的根节点。

重复以下步骤，直至 node 变为任意叶节点：

- 计算`w = weigh(enumerated, node.strategy)`。
- 根据`w`，将`node`移动至`2`中对应的子节点。

若`node.enumerated`与`enumerated`一致，返回`true`，否则返回`false`

## 算法

该问题的值域是有限的——排除`Rule(enumerated, tree)`影响的前提下，`tree`也是可穷举的。

`tree`最坏情况下是满 3 叉树，因此节点数最多为`3^0 + 3^1 + ... + 3^k = 2(3^k - 1)`个。因此，颗`tree`的节点数为`O(3^k)`。

显然`Strategy`是`Power(Products) × Power(Products)`的子集，因此穷举每个节点的称取策略的代价为`O(|Power(Products)|^2) = O(4^n)`。

从而，穷举所有`tree`的代价是`O((4^n)^(3^k))`。显然`TestTree(enumerated, tree)`的代价是`O(k)`，复杂度上可以忽略。从而，总的穷举代价为`O((4^n)^(3^k))`。

这样的复杂度有些不可接受，因为仅仅对于小学难度的`n=9, k=2`就达到了恐怖的`5.846e+48`（当然其中有许多情况是不符合要求的，`O(4^n)`只是粗略估计）。

因此我们需要一些**剪枝**。

如果不是暴力穷举每一次的全部`strategy`，而是将所有**等价**的`strategy`视作同一个，就可以大大减小底数`4^n`。

每一次称量操作，都会产生最多 4 个分组：较重组、较轻组、合格组、未知组。

具有相同分组的产品编号可被视作是**等价**的。

对于两个等价的编号，交换两者位置产生的`strategy`总是会得到相同的结果。从而可以将枚举所有产品的组合简化为枚举所有分组的选择个数的组合——将复杂度从指数降低到幂。

还有一些推断作为优化，详见代码实现。

## 许可证

```txt
 _____________________________________
< The GNU General Public License v3.0 >
 -------------------------------------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
```
