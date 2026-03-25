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
            ..Default::default()
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
                ..Default::default()
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
            ..Default::default()
        },
    )
    .await?;

    // Completed (SubQuest completed)
    let quest_3 = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Q3".to_string(),
            parent_id: None,
            ..Default::default()
        },
    )
    .await?;

    let quest_3_a = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Q3-a".to_string(),
            parent_id: Some(quest_3.id.clone()),
            ..Default::default()
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
                ..Default::default()
            },
        },
    )
    .await?;

    let quest_3_b = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Q3-b".to_string(),
            parent_id: Some(quest_3.id.clone()),
            ..Default::default()
        },
    )
    .await?;
    let quest_3_b = repo::update_quest(
        &pool,
        repo::UpdateQuestRequest {
            id: quest_3_b.id.clone(),
            data: repo::UpdateQuestData {
                title: None,
                completed: Some(true),
                ..Default::default()
            },
        },
    )
    .await?;
    dbg!(&quest_3_b);

    // Pending (SubQuests: 1 pending, 1 completed)
    let quest_4 = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Q4".to_string(),
            parent_id: None,
            ..Default::default()
        },
    )
    .await?;

    // SubQuest pending
    let _quest_4_a = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Q4-a".to_string(),
            parent_id: Some(quest_4.id.clone()),
            ..Default::default()
        },
    )
    .await?;

    // SubQuest completed
    let quest_4_b = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Q4-b".to_string(),
            parent_id: Some(quest_4.id.clone()),
            ..Default::default()
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
                ..Default::default()
            },
        },
    )
    .await?;

    let quests_in_db = sqlx::query_as::<_, QuestRow>("SELECT * FROM quests")
    .fetch_all(&pool)
    .await
    .expect("failed to get quests");

    assert_eq!(quests_in_db.len(), 8);
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

    let completed_sub_quests = quests.iter().find(|q| q.id == quest_3.id);
    assert!(completed_sub_quests.is_some());
    dbg!(&completed_sub_quests);
    assert_eq!(
        completed_sub_quests.unwrap().completed_at,
        quest_3_b.completed_at
    );

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
