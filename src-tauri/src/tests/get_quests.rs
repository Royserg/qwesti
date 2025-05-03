use crate::models::QuestRow;
use crate::repo;
use crate::tests::db_setup::setup;

#[tokio::test]
async fn get_quests_for_today_with_filters() -> anyhow::Result<()> {
    let pool = setup().await;

    // -- Prep --
    // Completed
    let quest_1 = repo::add_quest(
        &pool.clone(),
        repo::AddQuestRequest {
            title: "Q1".to_string(),
            parent_id: None,
        },
    )
    .await?;

    repo::update_quest(
        &pool.clone(),
        repo::UpdateQuestRequest {
            id: quest_1.id.clone(),
            data: repo::UpdateQuestData {
                title: None,
                completed: Some(true),
            },
        },
    )
    .await?;

    // Pending
    let quest_2 = repo::add_quest(
        &pool.clone(),
        repo::AddQuestRequest {
            title: "Q2".to_string(),
            parent_id: None,
        },
    )
    .await?;

    // Completed (SubQuest completed)
    let quest_3 = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Q3".to_string(),
            parent_id: None,
        },
    )
    .await?;

    let quest_3_a = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Q3-a".to_string(),
            parent_id: Some(quest_3.id.clone()),
        },
    )
    .await?;

    repo::update_quest(
        &pool,
        repo::UpdateQuestRequest {
            id: quest_3_a.id.clone(),
            data: repo::UpdateQuestData {
                title: None,
                completed: Some(true),
            },
        },
    )
    .await?;

    // Pending (SubQuests: 1 pending, 1 completed)
    let quest_4 = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Q4".to_string(),
            parent_id: None,
        },
    )
    .await?;

    // SubQuest pending
    let quest_4_a = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Q4-a".to_string(),
            parent_id: Some(quest_4.id.clone()),
        },
    )
    .await?;

    // SubQuest completed
    let quest_4_b = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Q4-b".to_string(),
            parent_id: Some(quest_4.id.clone()),
        },
    )
    .await?;

    repo::update_quest(
        &pool,
        repo::UpdateQuestRequest {
            id: quest_4_b.id.clone(),
            data: repo::UpdateQuestData {
                title: None,
                completed: Some(true),
            },
        },
    )
    .await?;

    let quests_in_db = sqlx::query_as!(
        QuestRow,
        r#"
                SELECT * FROM quests 
            "#,
    )
    .fetch_all(&pool)
    .await
    .expect("failed to get quests");

    dbg!(&quests_in_db);
    assert_eq!(quests_in_db.len(), 7);
    // -- Prep End --

    // -- Filter: all --
    let quests = repo::get_quests(
        &pool,
        repo::GetQuestsRequest {
            date: None,
            filter: "all".to_string(),
        },
    )
    .await?;

    assert_eq!(&quests.len(), &4);

    // -- Filter: completed --
    let quests = repo::get_quests(
        &pool,
        repo::GetQuestsRequest {
            date: None,
            filter: "completed".to_string(),
        },
    )
    .await?;

    assert_eq!(&quests.len(), &2);
    assert!(&quests.iter().any(|q| q.id == quest_1.id));
    assert!(&quests.iter().any(|q| q.id == quest_3.id));

    // -- Filter: pending --
    let quests = repo::get_quests(
        &pool,
        repo::GetQuestsRequest {
            date: None,
            filter: "pending".to_string(),
        },
    )
    .await?;

    assert_eq!(&quests.len(), &2);
    assert!(&quests.iter().any(|q| q.id == quest_2.id));
    assert!(&quests.iter().any(|q| q.id == quest_4.id));

    Ok(())
}
