use crate::models::QuestRow;
use crate::repo;
use crate::tests::db_setup::setup;

async fn set_order(pool: &sqlx::SqlitePool, ids: &[&str]) -> anyhow::Result<()> {
    for (index, id) in ids.iter().enumerate() {
        sqlx::query(
            r#"
            UPDATE quests
            SET order_index = ?1
            WHERE id = ?2
            "#,
        )
        .bind(i64::try_from(index)?)
        .bind(id)
        .execute(pool)
        .await?;
    }

    Ok(())
}

#[tokio::test]
async fn move_quest_reorders_within_same_parent() -> anyhow::Result<()> {
    let pool = setup().await;

    let quest_a = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "A".to_string(),
            parent_id: None,
        },
    )
    .await?;
    let quest_b = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "B".to_string(),
            parent_id: None,
        },
    )
    .await?;
    let quest_c = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "C".to_string(),
            parent_id: None,
        },
    )
    .await?;

    set_order(&pool, &[&quest_a.id, &quest_b.id, &quest_c.id]).await?;

    repo::move_quest(
        &pool,
        repo::MoveQuestRequest {
            id: quest_a.id.clone(),
            parent_id: None,
            index: 3,
        },
    )
    .await?;

    let quests = sqlx::query_as!(
        QuestRow,
        r#"
        SELECT * FROM quests
        WHERE parent_id IS NULL
        ORDER BY order_index, created_at DESC
        "#
    )
    .fetch_all(&pool)
    .await?;

    assert_eq!(quests.iter().map(|quest| quest.id.as_str()).collect::<Vec<_>>(), vec![
        quest_b.id.as_str(),
        quest_c.id.as_str(),
        quest_a.id.as_str(),
    ]);
    assert_eq!(quests.iter().map(|quest| quest.order_index).collect::<Vec<_>>(), vec![0, 1, 2]);

    Ok(())
}

#[tokio::test]
async fn move_quest_changes_parent_and_compacts_both_lists() -> anyhow::Result<()> {
    let pool = setup().await;

    let parent_a = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Parent A".to_string(),
            parent_id: None,
        },
    )
    .await?;
    let parent_b = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Parent B".to_string(),
            parent_id: None,
        },
    )
    .await?;

    let child_a1 = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Child A1".to_string(),
            parent_id: Some(parent_a.id.clone()),
        },
    )
    .await?;
    let child_a2 = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Child A2".to_string(),
            parent_id: Some(parent_a.id.clone()),
        },
    )
    .await?;
    let child_b1 = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Child B1".to_string(),
            parent_id: Some(parent_b.id.clone()),
        },
    )
    .await?;

    set_order(&pool, &[&parent_a.id, &parent_b.id]).await?;
    set_order(&pool, &[&child_a1.id, &child_a2.id]).await?;
    set_order(&pool, &[&child_b1.id]).await?;

    repo::update_quest(
        &pool,
        repo::UpdateQuestRequest {
            id: parent_b.id.clone(),
            data: repo::UpdateQuestData {
                title: None,
                completed: Some(true),
            },
        },
    )
    .await?;

    repo::move_quest(
        &pool,
        repo::MoveQuestRequest {
            id: child_a1.id.clone(),
            parent_id: Some(parent_b.id.clone()),
            index: 1,
        },
    )
    .await?;

    let parent_a_children = sqlx::query_as!(
        QuestRow,
        r#"
        SELECT * FROM quests
        WHERE parent_id IS ?1
        ORDER BY order_index, created_at DESC
        "#,
        parent_a.id
    )
    .fetch_all(&pool)
    .await?;
    let parent_b_children = sqlx::query_as!(
        QuestRow,
        r#"
        SELECT * FROM quests
        WHERE parent_id IS ?1
        ORDER BY order_index, created_at DESC
        "#,
        parent_b.id
    )
    .fetch_all(&pool)
    .await?;
    let refreshed_parent_b = sqlx::query_as!(
        QuestRow,
        r#"
        SELECT * FROM quests
        WHERE id = ?1
        "#,
        parent_b.id
    )
    .fetch_one(&pool)
    .await?;

    assert_eq!(
        parent_a_children
            .iter()
            .map(|quest| quest.id.as_str())
            .collect::<Vec<_>>(),
        vec![child_a2.id.as_str()],
    );
    assert_eq!(
        parent_b_children
            .iter()
            .map(|quest| quest.id.as_str())
            .collect::<Vec<_>>(),
        vec![child_b1.id.as_str(), child_a1.id.as_str()],
    );
    assert_eq!(
        parent_b_children
            .iter()
            .map(|quest| quest.order_index)
            .collect::<Vec<_>>(),
        vec![0, 1],
    );
    assert_eq!(refreshed_parent_b.completed, 0);
    assert_eq!(refreshed_parent_b.completed_at, None);

    Ok(())
}

#[tokio::test]
async fn move_quest_can_promote_child_to_root() -> anyhow::Result<()> {
    let pool = setup().await;

    let parent = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Parent".to_string(),
            parent_id: None,
        },
    )
    .await?;
    let child = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Child".to_string(),
            parent_id: Some(parent.id.clone()),
        },
    )
    .await?;

    repo::move_quest(
        &pool,
        repo::MoveQuestRequest {
            id: child.id.clone(),
            parent_id: None,
            index: 1,
        },
    )
    .await?;

    let roots = sqlx::query_as!(
        QuestRow,
        r#"
        SELECT * FROM quests
        WHERE parent_id IS NULL
        ORDER BY order_index, created_at DESC
        "#
    )
    .fetch_all(&pool)
    .await?;

    assert_eq!(roots.iter().map(|quest| quest.id.as_str()).collect::<Vec<_>>(), vec![
        parent.id.as_str(),
        child.id.as_str(),
    ]);

    Ok(())
}

#[tokio::test]
async fn move_quest_can_move_root_into_deep_nested_branch() -> anyhow::Result<()> {
    let pool = setup().await;

    let root_a = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Root A".to_string(),
            parent_id: None,
        },
    )
    .await?;
    let root_b = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Root B".to_string(),
            parent_id: None,
        },
    )
    .await?;
    let child_b = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Child B".to_string(),
            parent_id: Some(root_b.id.clone()),
        },
    )
    .await?;
    let grandchild_b = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Grandchild B".to_string(),
            parent_id: Some(child_b.id.clone()),
        },
    )
    .await?;

    set_order(&pool, &[&root_a.id, &root_b.id]).await?;
    set_order(&pool, &[&child_b.id]).await?;
    set_order(&pool, &[&grandchild_b.id]).await?;

    repo::move_quest(
        &pool,
        repo::MoveQuestRequest {
            id: root_a.id.clone(),
            parent_id: Some(grandchild_b.id.clone()),
            index: 0,
        },
    )
    .await?;

    let roots = sqlx::query_as!(
        QuestRow,
        r#"
        SELECT * FROM quests
        WHERE parent_id IS NULL
        ORDER BY order_index, created_at DESC
        "#
    )
    .fetch_all(&pool)
    .await?;
    let grandchild_children = sqlx::query_as!(
        QuestRow,
        r#"
        SELECT * FROM quests
        WHERE parent_id IS ?1
        ORDER BY order_index, created_at DESC
        "#,
        grandchild_b.id
    )
    .fetch_all(&pool)
    .await?;

    assert_eq!(
        roots.iter().map(|quest| quest.id.as_str()).collect::<Vec<_>>(),
        vec![root_b.id.as_str()],
    );
    assert_eq!(
        grandchild_children
            .iter()
            .map(|quest| quest.id.as_str())
            .collect::<Vec<_>>(),
        vec![root_a.id.as_str()],
    );
    assert_eq!(
        grandchild_children
            .iter()
            .map(|quest| quest.order_index)
            .collect::<Vec<_>>(),
        vec![0],
    );

    Ok(())
}

#[tokio::test]
async fn move_quest_can_move_into_empty_child_container() -> anyhow::Result<()> {
    let pool = setup().await;

    let target_parent = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Target Parent".to_string(),
            parent_id: None,
        },
    )
    .await?;
    let moving_root = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Moving Root".to_string(),
            parent_id: None,
        },
    )
    .await?;

    set_order(&pool, &[&target_parent.id, &moving_root.id]).await?;

    repo::update_quest(
        &pool,
        repo::UpdateQuestRequest {
            id: target_parent.id.clone(),
            data: repo::UpdateQuestData {
                title: None,
                completed: Some(true),
            },
        },
    )
    .await?;

    repo::move_quest(
        &pool,
        repo::MoveQuestRequest {
            id: moving_root.id.clone(),
            parent_id: Some(target_parent.id.clone()),
            index: 0,
        },
    )
    .await?;

    let target_children = sqlx::query_as!(
        QuestRow,
        r#"
        SELECT * FROM quests
        WHERE parent_id IS ?1
        ORDER BY order_index, created_at DESC
        "#,
        target_parent.id
    )
    .fetch_all(&pool)
    .await?;
    let refreshed_target_parent = sqlx::query_as!(
        QuestRow,
        r#"
        SELECT * FROM quests
        WHERE id = ?1
        "#,
        target_parent.id
    )
    .fetch_one(&pool)
    .await?;

    assert_eq!(
        target_children
            .iter()
            .map(|quest| quest.id.as_str())
            .collect::<Vec<_>>(),
        vec![moving_root.id.as_str()],
    );
    assert_eq!(refreshed_target_parent.completed, 0);
    assert_eq!(refreshed_target_parent.completed_at, None);

    Ok(())
}

#[tokio::test]
async fn move_quest_can_reparent_nested_task_to_different_nested_parent() -> anyhow::Result<()> {
    let pool = setup().await;

    let root_a = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Root A".to_string(),
            parent_id: None,
        },
    )
    .await?;
    let root_b = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Root B".to_string(),
            parent_id: None,
        },
    )
    .await?;
    let child_a = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Child A".to_string(),
            parent_id: Some(root_a.id.clone()),
        },
    )
    .await?;
    let sibling_a = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Sibling A".to_string(),
            parent_id: Some(root_a.id.clone()),
        },
    )
    .await?;
    let child_b = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Child B".to_string(),
            parent_id: Some(root_b.id.clone()),
        },
    )
    .await?;
    let grandchild_b = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Grandchild B".to_string(),
            parent_id: Some(child_b.id.clone()),
        },
    )
    .await?;

    set_order(&pool, &[&root_a.id, &root_b.id]).await?;
    set_order(&pool, &[&child_a.id, &sibling_a.id]).await?;
    set_order(&pool, &[&child_b.id]).await?;
    set_order(&pool, &[&grandchild_b.id]).await?;

    repo::move_quest(
        &pool,
        repo::MoveQuestRequest {
            id: child_a.id.clone(),
            parent_id: Some(grandchild_b.id.clone()),
            index: 0,
        },
    )
    .await?;

    let root_a_children = sqlx::query_as!(
        QuestRow,
        r#"
        SELECT * FROM quests
        WHERE parent_id IS ?1
        ORDER BY order_index, created_at DESC
        "#,
        root_a.id
    )
    .fetch_all(&pool)
    .await?;
    let grandchild_children = sqlx::query_as!(
        QuestRow,
        r#"
        SELECT * FROM quests
        WHERE parent_id IS ?1
        ORDER BY order_index, created_at DESC
        "#,
        grandchild_b.id
    )
    .fetch_all(&pool)
    .await?;

    assert_eq!(
        root_a_children
            .iter()
            .map(|quest| quest.id.as_str())
            .collect::<Vec<_>>(),
        vec![sibling_a.id.as_str()],
    );
    assert_eq!(
        grandchild_children
            .iter()
            .map(|quest| quest.id.as_str())
            .collect::<Vec<_>>(),
        vec![child_a.id.as_str()],
    );

    Ok(())
}

#[tokio::test]
async fn move_quest_rejects_cycles() -> anyhow::Result<()> {
    let pool = setup().await;

    let root = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Root".to_string(),
            parent_id: None,
        },
    )
    .await?;
    let child = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Child".to_string(),
            parent_id: Some(root.id.clone()),
        },
    )
    .await?;
    let grandchild = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Grandchild".to_string(),
            parent_id: Some(child.id.clone()),
        },
    )
    .await?;

    set_order(&pool, &[&root.id]).await?;
    set_order(&pool, &[&child.id]).await?;
    set_order(&pool, &[&grandchild.id]).await?;

    let result = repo::move_quest(
        &pool,
        repo::MoveQuestRequest {
            id: root.id.clone(),
            parent_id: Some(grandchild.id.clone()),
            index: 0,
        },
    )
    .await;

    assert!(result.is_err());

    Ok(())
}
