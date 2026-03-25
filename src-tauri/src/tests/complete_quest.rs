use crate::models::QuestRow;
use crate::repo;
use crate::tests::db_setup::setup;

async fn quest_by_id(pool: &sqlx::SqlitePool, quest_id: &str) -> anyhow::Result<QuestRow> {
    sqlx::query_as::<_, QuestRow>(
        r#"
        SELECT * FROM quests
        WHERE id = ?1
        "#,
    )
    .bind(quest_id)
    .fetch_one(pool)
    .await
    .map_err(Into::into)
}

#[tokio::test]
async fn complete_quest() -> anyhow::Result<()> {
    let pool = setup().await;

    let quest_props = repo::AddQuestRequest {
        title: "QUEST_TITLE".to_string(),
        parent_id: None,
        ..Default::default()
    };
    let quest = repo::add_quest(&pool, quest_props.clone()).await?;

    let found_quest = quest_by_id(&pool, &quest.id).await?;

    assert_eq!(&found_quest.completed, &0);
    assert_eq!(&found_quest.completed_at, &None);

    let completed_quest = repo::update_quest(
        &pool,
        repo::UpdateQuestRequest {
            id: quest.id.clone(),
            data: repo::UpdateQuestData {
                title: None,
                completed: Some(true),
                ..Default::default()
            },
        },
    )
    .await?;

    let found_quest = quest_by_id(&pool, &quest.id).await?;

    assert_eq!(&found_quest.completed, &1);
    assert_eq!(&found_quest.completed_at, &completed_quest.completed_at);

    Ok(())
}

#[tokio::test]
async fn completed_quest_resets_completion_when_sub_quests_added() -> anyhow::Result<()> {
    let pool = setup().await;

    let parent_quest_props = repo::AddQuestRequest {
        title: "PARENT_QUEST".to_string(),
        parent_id: None,
        ..Default::default()
    };
    let parent_quest = repo::add_quest(&pool, parent_quest_props.clone()).await?;

    // toggle completion
    repo::update_quest(
        &pool,
        repo::UpdateQuestRequest {
            id: parent_quest.id.clone(),
            data: repo::UpdateQuestData {
                title: None,
                completed: Some(true),
                ..Default::default()
            },
        },
    )
    .await?;

    // Verify completion
    let quest_id = parent_quest.id.clone();
    let found_quest = quest_by_id(&pool, &quest_id).await?;

    assert_eq!(&found_quest.completed, &1);
    assert!(&found_quest.completed_at.is_some());

    // Add sub quest
    let sub_quest_props = repo::AddQuestRequest {
        title: "SUB_QUEST".to_string(),
        parent_id: Some(parent_quest.id.clone()),
        ..Default::default()
    };
    repo::add_quest(&pool, sub_quest_props.clone()).await?;

    let quest_id = parent_quest.id.clone();
    let found_quest = quest_by_id(&pool, &quest_id).await?;

    assert_eq!(&found_quest.completed, &0);
    assert_eq!(&found_quest.completed_at, &None);

    Ok(())
}
