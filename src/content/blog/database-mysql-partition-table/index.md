---
title: "MySQL分区表（1）"
description: "初识MySQL表分区，了解基本操作和相关知识"
publishedAt: "2026-09-13"
updatedAt:
category: "技术实践"
tags: [数据库, MySQL, 分区]
series:
draft: false
---

## 前言

+ 分区是一种表的设计模式，通俗地讲表分区是将一大表，根据条件分割成若干个小表，但是对于应用程序来讲，分区的表和没有分区的表是一样的。换句话来讲，分区对于应用是透明的，只是数据库对于数据的重新整理；
+ 即只是在数据的物理存储层面将一张表根据条件分割成多个存储文件，在应用程序上还是一张表；
+ 在分区创建之后，每个分区都会对应一个idb文件。

## 分区的目的

### 1. 提升查询效率

+ 在单表数据量较大，各个分区数据量差别不大的情况下，可以提升查询效率；
+ 分区之后，在执行查询时，MySQL的优化器会根据分区定义过滤那些没有我们需要的数据的分区，这样查询就可以无需扫描所有分区，只需要查找包含需要数据的分区即可。

### 2. 方便数据表的维护

+ 将数据按照一个较粗的粒度分别存放在不同的表中，这样做可以将相关的数据存放在一起；
+ 在删除数据时，删除整个分区的数据也会变得方便。

## 分区类型

+ RANGE分区：最为常用，基于属于一个给定连续区间的列值，把多行分配给分区。该分区的特点是多个分区的范围要连续，不能重叠，最常见的是基于时间字段；
+ LIST分区：LIST分区和RANGE分区类似，区别在于LIST是枚举值列表的集合，RANGE是连续的区间值的集合；
+ HASH分区：基于用户定义的表达式的返回值来进行选择的分区，该表达式使用将要插入到表中的这些行的列值进行计算。这个函数可以包含MySQL中有效的、产生非负整数值的任何表达式；
+ KEY分区：类似于按HASH分区，区别在于KEY分区只支持计算一列或多列，且MySQL服务器提供其自身的哈希函数。必须有一列或多列包含整数值。

## 分区操作示例（以RANGE分区为例）

### 1. 创建分区表

```sql
# 创建分区表
mysql> CREATE TABLE `tr` (
    ->   `id` INT, 
    ->   `name` VARCHAR(50), 
    ->   `purchased` DATE
    -> ) ENGINE=InnoDB DEFAULT CHARSET=utf8
    -> PARTITION BY RANGE( YEAR(purchased) ) (
    -> PARTITION p0 VALUES LESS THAN (1990),
    -> PARTITION p1 VALUES LESS THAN (1995),
    -> PARTITION p2 VALUES LESS THAN (2000),
    -> PARTITION p3 VALUES LESS THAN (2005),
    -> PARTITION p4 VALUES LESS THAN (2010),
    -> PARTITION p5 VALUES LESS THAN (2015)
    -> );
Query OK, 0 rows affected (0.28 sec)

# 插入数据
mysql> INSERT INTO `tr` VALUES
    ->     (1, 'desk organiser', '2003-10-15'),
    ->     (2, 'alarm clock', '1997-11-05'),
    ->     (3, 'chair', '2009-03-10'),
    ->     (4, 'bookcase', '1989-01-10'),
    ->     (5, 'exercise bike', '2014-05-09'),
    ->     (6, 'sofa', '1987-06-05'),
    ->     (7, 'espresso maker', '2011-11-22'),
    ->     (8, 'aquarium', '1992-08-04'),
    ->     (9, 'study desk', '2006-09-16'),
    ->     (10, 'lava lamp', '1998-12-25');
Query OK, 10 rows affected (0.03 sec)
Records: 10  Duplicates: 0  Warnings: 0
```

### 2. 查看某个分区的数据

```sql
mysql> SELECT * FROM tr PARTITION (p2);
+------+-------------+------------+
| id   | name        | purchased  |
+------+-------------+------------+
|    2 | alarm clock | 1997-11-05 |
|   10 | lava lamp   | 1998-12-25 |
+------+-------------+------------+
2 rows in set (0.00 sec)
```

### 3. 增加分区

```sql
mysql> alter table tr add partition(
    -> PARTITION p6 VALUES LESS THAN (2020)
    -> );
Query OK, 0 rows affected (0.06 sec)
Records: 0  Duplicates: 0  Warnings: 0
```

### 4. 拆分分区

```sql
# 拆分分区
mysql> alter table tr reorganize partition p5 into(
    ->   partition s0 values less than(2012),
    ->   partition s1 values less than(2015)
    -> );
Query OK, 0 rows affected (0.26 sec)
Records: 0  Duplicates: 0  Warnings: 0
```

### 5. 合并分区

```sql
# 合并分区
mysql> alter table tr reorganize partition s0,s1 into ( 
    ->     partition p5 values less than (2015) 
    -> );
Query OK, 0 rows affected (0.12 sec)
Records: 0  Duplicates: 0  Warnings: 0
```

### 6. 删除分区

```sql
# 清空某分区的数据
mysql> alter table tr truncate partition p0;
Query OK, 0 rows affected (0.11 sec)

# 删除分区
mysql> alter table tr drop partition p1;
Query OK, 0 rows affected (0.06 sec)
Records: 0  Duplicates: 0  Warnings: 0
```

### 7. 交换分区

```sql
# 先创建与分区表同样结构的交换表
mysql> CREATE TABLE `tr_archive` (
    ->   `id` INT, 
    ->   `name` VARCHAR(50), 
    ->   `purchased` DATE
    -> ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
Query OK, 0 rows affected (0.28 sec)
# 执行exchange交换分区 
mysql> alter table tr exchange PARTITION p2 with table tr_archive;
Query OK, 0 rows affected (0.13 sec) 
```

## 分区注意事项及适用场景

+ 其实分区表的使用有很多限制和需要注意的事项，参考官方文档，简要总结几点如下：

  + 分区字段必须是整数类型或解析为整数的表达式;
  + 分区字段建议设置为NOT NULL，若某行数据分区字段为null，在RANGE分区中，该行数据会划分到最小的分区里;
  + MySQL分区中如果存在主键或唯一键，则分区列必须包含在其中。
  + Innodb分区表不支持外键;
  + 更改sql_mode模式可能影响分区表的表现;
  + 分区表不影响自增列;
  + RANGE分区中，如果插入一条不满足所有分区条件的数据，会报错:

  ```sql
  1526 - Table has no partition for value 738976
  ```

+ 上面的介绍中可以看出，分区表适用于一些日志记录表。这类表的特点是数据量大、并且有**冷热数据**区分，可以按照时间维度来进行数据归档。这类表是比较适合使用分区表的，因为分区表可以对单独的分区进行维护，对于数据归档更方便。

+ 分区表的分区信息是维护在information_schema数据库的PARTITIONS表中的，即其存储的维度是整个数据库连接，当一个数据库连接包含多个db时，如果想要通过PARTITION_NAME（分区名称）区分唯一的话最好是在分区名称中添加db名等。

## 分区表为什么不常用

+ 分区字段的选择有限制。
+ 若查询不走分区键，则可能会扫描所有分区，效率不会提升。
+ 若数据分布不均，分区大小差别较大，可能性能提升也有限。
+ 普通表改造成分区表比较繁琐。
+ 需要持续对分区进行维护，比如到了6月份前就要新增6月份的分区。
+ 增加学习成本，存在未知风险。

## 参考

+ [MySQL分区表最佳实践](https://juejin.cn/post/6844904174241447949)
+ [MySQL分区Demo](http://mysql.rjweb.org/doc.php/partitionmaint)
+ [官方文档](https://dev.mysql.com/doc/refman/5.7/en/partitioning.html)
