#!/bin/bash

FUNC=$1
FUNC2=$2

##UI ONLY
ui_targets=(
"-target=data.template_file.bucket_pacman"
"-target=aws_s3_bucket.pacman"
"-target=aws_s3_bucket_object.css_files"
"-target=aws_s3_bucket_object.error"
"-target=aws_s3_bucket_object.img_files"
"-target=aws_s3_bucket_object.index"
"-target=aws_s3_bucket_object.js_files"
"-target=aws_s3_bucket_object.snd_files"
"-target=aws_s3_bucket_object.start"
"-target=aws_s3_bucket_object.scoreboard"
"-target=random_string.random_string"
)

backend_targets=(
"-target=data.aws_availability_zones.available"
"-target=data.aws_iam_policy_document.ksqldb_server_policy_document"
"-target=data.template_file.bucket_pacman"
"-target=data.template_file.ccloud_properties"
"-target=data.template_file.ksqldb_server_definition"
"-target=data.template_file.local_ksql_server"
"-target=data.template_file.variables_js"
"-target=data.template_file.wake_up_function"
"-target=aws_alb.ksqldb_lbr"
"-target=aws_alb_listener.ksqldb_lbr_listener"
"-target=aws_alb_target_group.ksqldb_target_group"
"-target=aws_api_gateway_deployment.event_handler_v1"
"-target=aws_api_gateway_deployment.highest_score_v1"
"-target=aws_api_gateway_integration.event_handler_options_integration"
"-target=aws_api_gateway_integration.event_handler_post_integration"
"-target=aws_api_gateway_integration.highest_score_get_integration"
"-target=aws_api_gateway_integration.highest_score_options_integration"
"-target=aws_api_gateway_integration_response.event_handler_options_integration_response"
"-target=aws_api_gateway_integration_response.highest_score_options_integration_response"
"-target=aws_api_gateway_method.event_handler_options_method"
"-target=aws_api_gateway_method.event_handler_post_method"
"-target=aws_api_gateway_method.highest_score_get_method"
"-target=aws_api_gateway_method.highest_score_options_method"
"-target=aws_api_gateway_method_response.event_handler_options_method_response"
"-target=aws_api_gateway_method_response.event_handler_post_method_response"
"-target=aws_api_gateway_method_response.highest_score_get_method_response"
"-target=aws_api_gateway_method_response.highest_score_options_method_response"
"-target=aws_api_gateway_resource.event_handler_resource"
"-target=aws_api_gateway_resource.highest_score_resource"
"-target=aws_api_gateway_rest_api.event_handler_api"
"-target=aws_api_gateway_rest_api.highest_score_api"
"-target=aws_appautoscaling_policy.ksqldb_server_auto_scaling_down"
"-target=aws_appautoscaling_policy.ksqldb_server_auto_scaling_up"
"-target=aws_appautoscaling_target.ksqldb_server_auto_scaling_target"
"-target=aws_cloudwatch_event_rule.event_handler_every_five_minutes"
"-target=aws_cloudwatch_event_rule.highest_score_every_one_minute"
"-target=aws_cloudwatch_event_target.event_handler_every_five_minutes"
"-target=aws_cloudwatch_event_target.highest_score_every_one_minute"
"-target=aws_cloudwatch_metric_alarm.ksqldb_server_cpu_high_alarm"
"-target=aws_cloudwatch_metric_alarm.ksqldb_server_cpu_low_alarm"
"-target=aws_ecs_cluster.ksqldb_server_cluster"
"-target=aws_ecs_service.ksqldb_server_service"
"-target=aws_ecs_task_definition.ksqldb_server_task"
"-target=aws_eip.default"
"-target=aws_iam_role.event_handler_role"
"-target=aws_iam_role.highest_score_role"
"-target=aws_iam_role.ksqldb_server_role"
"-target=aws_iam_role_policy.event_handler_role_policy"
"-target=aws_iam_role_policy.highest_score_role_policy"
"-target=aws_iam_role_policy.ksqldb_server_role_policy"
"-target=aws_iam_role_policy_attachment.ksqldb_server_policy_attachment"
"-target=aws_internet_gateway.default"
"-target=aws_lambda_function.event_handler_function"
"-target=aws_lambda_function.highest_score_function"
"-target=aws_lambda_permission.event_handler_api_gateway_trigger"
"-target=aws_lambda_permission.event_handler_cloudwatch_trigger"
"-target=aws_lambda_permission.highest_score_api_gateway_trigger"
"-target=aws_lambda_permission.highest_score_cloudwatch_trigger"
"-target=aws_nat_gateway.default"
"-target=aws_route.default"
"-target=aws_route.private_route_2_internet"
"-target=aws_route_table.private_route_table"
"-target=aws_route_table_association.private_subnet_association"
"-target=aws_route_table_association.public_subnet_association"
"-target=aws_s3_bucket.pacman"
"-target=aws_s3_bucket_object.variables_js"
"-target=aws_security_group.ecs_tasks"
"-target=aws_security_group.load_balancer"
"-target=aws_subnet.private_subnet"
"-target=aws_subnet.public_subnet"
"-target=aws_vpc.default"
"-target=local_file.ccloud_properties"
"-target=local_file.local_ksql_server"
"-target=null_resource.build_functions"
"-target=random_string.random_string"
)

# mycmd=(ls)               # initial command
# mycmd+=("$targetdir")    # the filename




case $FUNC in
  "destroy")
    echo "destroy ($FUNC) $FUNC2"
    if [ "$FUNC2" == "ui" ]
    then
        terraform destroy -auto-approve ${ui_targets[@]}
    
    elif [ "$FUNC2" == "backend" ]
    then
        terraform destroy -auto-approve ${backend_targets[@]}
    else
        echo "Done nothing"
    fi
    ;;

  "apply")
    echo "apply ($FUNC)  $FUNC2"
    if [ "$FUNC2" == "ui" ]
    then
        terraform apply -auto-approve ${ui_targets[@]}
    
    elif [ "$FUNC2" == "backend" ]
    then
        terraform apply -auto-approve ${backend_targets[@]}
    else
        echo "Done nothing"
    fi
    ;;

  *)
    echo 'command not recognized'
    ;;
esac


