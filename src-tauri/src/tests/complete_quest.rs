use crate::models::QuestRow;
use crate::repo;
use crate::tests::db_setup::setup;

#[tokio::test]
async fn complete_quest() -> anyhow::Result<()> {
    let pool = setup().await;

    let quest_props = repo::AddQuestRequest {
        title: "QUEST_TITLE".to_string(),
        parent_id: None,
    };
    let quest = repo::add_quest(&pool, quest_props.clone()).await?;

    let found_quest = sqlx::query_as!(
        QuestRow,
        r#"
        SELECT * FROM 
          quests 
        WHERE 
          id = $1
        "#,
        quest.id
    )
    .fetch_one(&pool)
    .await?;

    assert_eq!(&found_quest.completed, &0);
    assert_eq!(&found_quest.completed_at, &None);

    let completed_quest = repo::update_quest(
        &pool,
        repo::UpdateQuestRequest {
            id: quest.id.clone(),
            data: repo::UpdateQuestData {
                title: None,
                completed: Some(true),
            },
        },
    )
    .await?;

    let found_quest = sqlx::query_as!(
        QuestRow,
        r#"
        SELECT * FROM 
          quests 
        WHERE 
          id = $1
        "#,
        quest.id
    )
    .fetch_one(&pool)
    .await?;

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
            },
        },
    )
    .await?;

    // Verify completion
    let quest_id = parent_quest.id.clone();
    let found_quest = sqlx::query_as!(
        QuestRow,
        r#"
        SELECT * FROM 
          quests 
        WHERE 
          id = $1
        "#,
        quest_id
    )
    .fetch_one(&pool)
    .await?;

    assert_eq!(&found_quest.completed, &1);
    assert!(&found_quest.completed_at.is_some());

    // Add sub quest
    let sub_quest_props = repo::AddQuestRequest {
        title: "SUB_QUEST".to_string(),
        parent_id: Some(parent_quest.id.clone()),
    };
    repo::add_quest(&pool, sub_quest_props.clone()).await?;

    let quest_id = parent_quest.id.clone();
    let found_quest = sqlx::query_as!(
        QuestRow,
        r#"
        SELECT * FROM
          quests
        WHERE
          id = $1
        "#,
        quest_id
    )
    .fetch_one(&pool)
    .await?;

    assert_eq!(&found_quest.completed, &0);
    assert_eq!(&found_quest.completed_at, &None);

    Ok(())
}
