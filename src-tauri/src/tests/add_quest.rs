use crate::models::QuestRow;
use crate::repo::{self, AddQuestRequest};
use crate::tests::db_setup::setup;

async fn all_quests(pool: &sqlx::SqlitePool) -> anyhow::Result<Vec<QuestRow>> {
    sqlx::query_as::<_, QuestRow>("SELECT * FROM quests")
        .fetch_all(pool)
        .await
        .map_err(Into::into)
}

#[tokio::test]
async fn add_quests() -> anyhow::Result<()> {
    let pool = setup().await;

    let quest1_props = repo::AddQuestRequest {
        title: "Q1".to_string(),
        parent_id: None,
        ..Default::default()
    };
    let quest2_props = repo::AddQuestRequest {
        title: "Q2".to_string(),
        parent_id: None,
        ..Default::default()
    };

    repo::add_quest(&pool, quest1_props.clone()).await?;
    repo::add_quest(&pool, quest2_props.clone()).await?;

    // Verify insertion
    let quest = all_quests(&pool).await?;

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
        ..Default::default()
    };
    let parent_quest = repo::add_quest(&pool, parent_quest_props.clone()).await?;

    let child_quest1_props = repo::AddQuestRequest {
        title: "QUEST_CHILD".to_string(),
        parent_id: Some(parent_quest.id.clone()),
        ..Default::default()
    };
    let child_quest1 = repo::add_quest(&pool, child_quest1_props.clone()).await?;

    // Complete 1st subQuest
    repo::update_quest(
        &pool,
        repo::UpdateQuestRequest {
            id: child_quest1.id.clone(),
            data: repo::UpdateQuestData {
                title: None,
                completed: Some(true),
                ..Default::default()
            },
        },
    )
    .await?;

    // Verify insertion
    let quests = all_quests(&pool).await?;

    assert_eq!(&quests.len(), &2);
    assert_eq!(&quests[0].parent_id, &None);
    assert_eq!(quests[1].parent_id.as_deref().unwrap(), parent_quest.id);
    assert_eq!(quests[1].completed, 1);

    // Add 2nd subQuest, 1st subQuests should stay completed
    let child_quest2_props = repo::AddQuestRequest {
        title: "QUEST_CHILD2".to_string(),
        parent_id: Some(parent_quest.id.clone()),
        ..Default::default()
    };
    repo::add_quest(&pool, child_quest2_props.clone()).await?;

    // Verify 1st subQuest is still completed
    let quests = all_quests(&pool).await?;

    assert_eq!(&quests.len(), &3);
    assert_eq!(&quests[1].id, &child_quest1.id);
    assert_eq!(&quests[1].completed, &1);

    Ok(())
}
