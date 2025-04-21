use crate::models::QuestRow;
use crate::repo::{self, AddQuestRequest};
use crate::tests::db_setup::setup;

#[tokio::test]
async fn add_quests() -> anyhow::Result<()> {
    let pool = setup().await;

    let quest1_props = repo::AddQuestRequest {
        title: "Q1".to_string(),
        parent_id: None,
    };
    let quest2_props = repo::AddQuestRequest {
        title: "Q2".to_string(),
        parent_id: None,
    };

    repo::add_quest(&pool, quest1_props.clone()).await?;
    repo::add_quest(&pool, quest2_props.clone()).await?;

    // Verify insertion
    let quest = sqlx::query_as!(QuestRow, "SELECT * FROM quests")
        .fetch_all(&pool)
        .await?;

    assert_eq!(&quest[0].title, &quest1_props.title);
    assert_eq!(&quest[1].title, &quest2_props.title);
    Ok(())
}

#[tokio::test]
async fn add_sub_quest() -> anyhow::Result<()> {
    let pool = setup().await;

    let parent_quest_props = repo::AddQuestRequest {
        title: "QUEST_PARENT".to_string(),
        parent_id: None,
    };
    let parent_quest = repo::add_quest(&pool, parent_quest_props.clone()).await?;

    let child_quest_props = repo::AddQuestRequest {
        title: "QUEST_CHILD".to_string(),
        parent_id: Some(parent_quest.id.clone()),
    };
    repo::add_quest(&pool, child_quest_props.clone()).await?;

    // Verify insertion
    let quest = sqlx::query_as!(QuestRow, "SELECT * FROM quests")
        .fetch_all(&pool)
        .await?;

    assert_eq!(&quest[0].parent_id, &None);
    assert_eq!(quest[1].parent_id.as_deref().unwrap(), parent_quest.id);

    Ok(())
}
